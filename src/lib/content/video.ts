import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile, readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { renderDesign } from './render';
import type { Scene } from './copy';
import type { ThemeKey } from './formats';

const run = promisify(execFile);
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const FFPROBE = process.env.FFPROBE_PATH || 'ffprobe';

export type VideoJob = { width: number; height: number; durationSeconds: 15 | 30 | 60; scenes: Scene[]; theme: ThemeKey; productName: string; fps?: number };
export type VideoResult = { path: string; bytes: number; sha256: string; probe: ProbeResult; cleanup: () => Promise<void> };
export type ProbeResult = { codec: string; pixFmt: string; width: number; height: number; duration: number; hasAudio: boolean; formatName: string };

export async function probe(file: string): Promise<ProbeResult> {
  const { stdout } = await run(FFPROBE, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]);
  const j = JSON.parse(stdout) as { streams: { codec_type: string; codec_name: string; pix_fmt?: string; width?: number; height?: number }[]; format: { duration: string; format_name: string } };
  const v = j.streams.find((s) => s.codec_type === 'video');
  if (!v) throw new Error('no_video_stream');
  return { codec: v.codec_name, pixFmt: v.pix_fmt ?? '', width: v.width ?? 0, height: v.height ?? 0, duration: Number(j.format.duration), hasAudio: j.streams.some((s) => s.codec_type === 'audio'), formatName: j.format.format_name };
}

/** Verify that an MP4 really matches the job (codec, pixel format, size, duration ±0.2 s). */
export function verifyVideo(p: ProbeResult, job: Pick<VideoJob, 'width' | 'height' | 'durationSeconds'>): string[] {
  const errs: string[] = [];
  if (p.codec !== 'h264') errs.push(`codec ${p.codec} != h264`);
  if (p.pixFmt !== 'yuv420p') errs.push(`pix_fmt ${p.pixFmt} != yuv420p`);
  if (p.width !== job.width || p.height !== job.height) errs.push(`size ${p.width}x${p.height} != ${job.width}x${job.height}`);
  if (Math.abs(p.duration - job.durationSeconds) > 0.2) errs.push(`duration ${p.duration.toFixed(2)} != ${job.durationSeconds}`);
  if (!/mp4/.test(p.formatName)) errs.push(`container ${p.formatName} is not mp4`);
  return errs;
}

function sceneDesign(scene: Scene, theme: ThemeKey, productName: string) {
  if (scene.kind === 'intro') return { template: 'product-launch' as const, theme, headline: scene.headline, subline: scene.subline, productName };
  if (scene.kind === 'problem') return { template: 'quote-card' as const, theme: theme === 'forest' ? ('light' as const) : theme, headline: scene.headline, productName };
  if (scene.kind === 'feature') return { template: 'feature-list' as const, theme, headline: scene.headline, bullets: scene.bullets && scene.bullets.length > 1 ? scene.bullets : undefined, productName };
  return { template: 'product-launch' as const, theme: 'lime' as const, headline: scene.headline, subline: scene.subline, cta: scene.headline.slice(0, 40), productName };
}

/**
 * Render scenes to stills, encode each with fades, concatenate, add a silent AAC track,
 * then probe + verify. Throws if the result does not match the job specification.
 */
export async function renderVideo(job: VideoJob, onProgress?: (pct: number) => Promise<void> | void): Promise<VideoResult> {
  const fps = job.fps ?? 30;
  const total = job.scenes.reduce((a, s) => a + s.seconds, 0);
  if (total !== job.durationSeconds) throw new Error(`storyboard_duration_mismatch ${total} != ${job.durationSeconds}`);
  const dir = await mkdtemp(path.join(tmpdir(), 'nexora-render-'));
  const cleanup = () => rm(dir, { recursive: true, force: true });
  try {
    const segments: string[] = [];
    for (let i = 0; i < job.scenes.length; i++) {
      const s = job.scenes[i];
      const still = await renderDesign(sceneDesign(s, job.theme, job.productName), job.width, job.height, 'png');
      const png = path.join(dir, `scene-${i}.png`);
      await writeFile(png, still.buffer);
      const seg = path.join(dir, `seg-${i}.mp4`);
      const fadeOut = Math.max(0, s.seconds - 0.4).toFixed(2);
      await run(FFMPEG, ['-y', '-v', 'error', '-loop', '1', '-framerate', String(fps), '-t', String(s.seconds), '-i', png,
        '-vf', `fade=t=in:st=0:d=0.4,fade=t=out:st=${fadeOut}:d=0.4,format=yuv420p`,
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-r', String(fps), '-pix_fmt', 'yuv420p', '-an', seg], { timeout: 180_000 });
      segments.push(seg);
      await onProgress?.(Math.round(((i + 1) / job.scenes.length) * 85));
    }
    const list = path.join(dir, 'list.txt');
    await writeFile(list, segments.map((s) => `file '${s.replace(/'/g, "'\\''")}'`).join('\n'));
    const out = path.join(dir, 'output.mp4');
    await run(FFMPEG, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
      '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '64k', '-t', String(job.durationSeconds), '-movflags', '+faststart', out], { timeout: 180_000 });
    const p = await probe(out);
    const errs = verifyVideo(p, job);
    if (errs.length) throw new Error('video_verification_failed: ' + errs.join('; '));
    await onProgress?.(95);
    const buf = await readFile(out);
    return { path: out, bytes: (await stat(out)).size, sha256: createHash('sha256').update(buf).digest('hex'), probe: p, cleanup };
  } catch (e) {
    await cleanup();
    throw e;
  }
}
