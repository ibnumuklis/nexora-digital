/**
 * NEXORA render worker — processes queued render_jobs (MP4 video, PNG/JPG images).
 *
 * Modes:
 *   Queue:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx --tsconfig tsconfig.worker.json worker/render-worker.ts
 *   Local:  npx tsx --tsconfig tsconfig.worker.json worker/render-worker.ts --local job.json --out ./worker/out
 *
 * The service-role key is used ONLY here (server-side worker host), never in the web app or browser.
 * Every output is probed/verified before the job is marked completed (no fake downloads).
 */
import { readFile, copyFile, mkdir } from 'node:fs/promises';
import { hostname } from 'node:os';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { renderVideo } from '../src/lib/content/video';
import { renderDesign } from '../src/lib/content/render';
import { buildStoryboard } from '../src/lib/content/copy';

const inputSchema = z.object({
  title: z.string().max(120).optional(),
  theme: z.enum(['forest', 'light', 'lime']).default('forest'),
  cta: z.string().max(40).default('Learn more'),
  facts: z.object({
    name: z.string().min(1).max(120),
    short_description: z.string().max(240).nullish(),
    problem_statement: z.string().max(1000).nullish(),
    benefits: z.array(z.string().max(200)).max(12).default([]),
    features: z.array(z.string().max(120)).max(12).default([]),
  }),
  design: z.record(z.string(), z.unknown()).optional(),
});

type Job = { id: string; job_type: 'image' | 'video'; output_format: 'png' | 'jpg' | 'mp4'; width: number; height: number; duration_seconds: 15 | 30 | 60 | null; template_key: string; input: unknown };

async function processJob(job: Job, onProgress: (p: number) => Promise<void>) {
  const input = inputSchema.parse(job.input);
  if (job.job_type === 'video') {
    const scenes = buildStoryboard(input.facts, job.duration_seconds!, input.cta);
    const res = await renderVideo({ width: job.width, height: job.height, durationSeconds: job.duration_seconds!, scenes, theme: input.theme, productName: input.facts.name }, onProgress);
    return { file: res.path, mime: 'video/mp4' as const, bytes: res.bytes, sha256: res.sha256, duration: res.probe.duration, cleanup: res.cleanup };
  }
  const design = { template: (job.template_key as never) ?? 'product-launch', theme: input.theme, headline: input.facts.short_description ?? input.facts.name, productName: input.facts.name, cta: input.cta, ...(input.design ?? {}) };
  const img = await renderDesign(design as never, job.width, job.height, job.output_format === 'jpg' ? 'jpg' : 'png');
  const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
  const dir = await mkdtemp(path.join((await import('node:os')).tmpdir(), 'nexora-img-'));
  const file = path.join(dir, `out.${job.output_format}`);
  await writeFile(file, img.buffer);
  return { file, mime: img.mime, bytes: img.bytes, sha256: img.sha256, duration: null, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

async function local(jobPath: string, outDir: string) {
  const job = JSON.parse(await readFile(jobPath, 'utf8')) as Job;
  const started = Date.now();
  const r = await processJob(job, async (p) => { process.stdout.write(`progress ${p}%\n`); });
  await mkdir(outDir, { recursive: true });
  const dest = path.join(outDir, `${job.id}.${job.output_format}`);
  await copyFile(r.file, dest);
  await r.cleanup();
  console.log(JSON.stringify({ ok: true, file: dest, mime: r.mime, bytes: r.bytes, sha256: r.sha256, duration: r.duration, ms: Date.now() - started }));
}

async function queue() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for queue mode.');
  const db = createClient(url, key, { auth: { persistSession: false } });
  const workerId = `${hostname()}-${process.pid}`.slice(0, 80);
  const idleMs = Number(process.env.WORKER_POLL_MS ?? 5000);
  console.log(`[worker ${workerId}] started`);
  let running = true;
  process.on('SIGTERM', () => { running = false; });
  process.on('SIGINT', () => { running = false; });
  while (running) {
    const { data, error } = await db.rpc('claim_render_job', { p_worker: workerId });
    const job = data as Job | null;
    if (error) { console.error('[worker] claim failed', error.message); await new Promise((r) => setTimeout(r, idleMs * 2)); continue; }
    if (!job?.id) { await new Promise((r) => setTimeout(r, idleMs)); continue; }
    console.log(`[worker] job ${job.id} ${job.job_type} ${job.width}x${job.height}`);
    try {
      const r = await processJob(job, async (p) => { await db.rpc('update_render_progress', { p_job: job.id, p_worker: workerId, p_progress: p }); });
      const objectPath = `renders/${job.id}.${job.output_format}`;
      const body = await readFile(r.file);
      const up = await db.storage.from('nexora-assets').upload(objectPath, body, { contentType: r.mime, upsert: true });
      await r.cleanup();
      if (up.error) throw new Error('upload_failed: ' + up.error.message);
      const { error: cErr } = await db.rpc('complete_render_job', { p_job: job.id, p_worker: workerId, p_storage_path: `nexora-assets/${objectPath}`, p_mime: r.mime, p_size: r.bytes, p_width: job.width, p_height: job.height, p_duration: r.duration, p_checksum: r.sha256 });
      if (cErr) throw new Error('complete_failed: ' + cErr.message);
      console.log(`[worker] job ${job.id} completed (${r.bytes} bytes)`);
    } catch (e) {
      const msg = (e as Error).message.slice(0, 900);
      console.error(`[worker] job ${job.id} failed: ${msg}`);
      await db.rpc('fail_render_job', { p_job: job.id, p_worker: workerId, p_error: msg });
    }
  }
  console.log('[worker] stopped');
}

const args = process.argv.slice(2);
const li = args.indexOf('--local');
(li >= 0 ? local(args[li + 1], args[args.indexOf('--out') + 1] || './worker/out') : queue()).catch((e) => {
  console.error(e);
  process.exit(1);
});
