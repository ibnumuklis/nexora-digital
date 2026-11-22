'use server';
import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { formToObject, must, runAction, type ActionResult } from '@/lib/admin/action';
import type { StaffContext } from '@/lib/auth/session';
import { generateCopy, OBJECTIVES, PLATFORMS, TONES, type ProductFacts } from '@/lib/content/copy';
import { IMAGE_FORMATS, TEMPLATES, THEMES, imageFormat, videoFormat, VIDEO_DURATIONS } from '@/lib/content/formats';
import { renderDesign } from '@/lib/content/render';
import { sniffMime } from '@/lib/security/files';
import { designFor } from '@/lib/content/server';

const P = ['/admin/content'];
const uuid = z.string().uuid();

export async function createProject(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({
    title: z.string().trim().min(3).max(160),
    product_id: z.string().uuid().optional().or(z.literal('')).transform((v) => v || null),
    content_type: z.enum(['social_post', 'carousel', 'story', 'video', 'article_promo']),
    objective: z.enum(OBJECTIVES), channel: z.enum(PLATFORMS), tone: z.enum(TONES),
    audience: z.string().trim().max(160).optional().transform((v) => v || null),
  });
  let id: string | undefined;
  const res = await runAction('content.write', schema, formToObject(fd), async (ctx, d) => {
    const row = must(await ctx.supabase.from('content_projects').insert({ ...d, status: 'draft', created_by: ctx.userId, brief: {} }).select('id').single());
    id = row.id;
  }, P);
  if (res.ok && id) redirect(`/admin/content/${id}`);
  return res;
}

async function productFacts(ctx: StaffContext, productId: string | null): Promise<(ProductFacts & { problem_statement?: string | null }) | null> {
  if (!productId) return null;
  const p = must(await ctx.supabase.from('products').select('name,short_description,target_market,benefits,demo_enabled,problem_statement,features:product_features(title,sort_order)').eq('id', productId).single());
  return { name: p.name, short_description: p.short_description, target_market: p.target_market, benefits: p.benefits, demo_enabled: p.demo_enabled, problem_statement: p.problem_statement, features: [...(p.features ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((f) => f.title) };
}

export async function generateProjectCopy(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({ id: uuid, language: z.enum(['en', 'id']).default('en') });
  return runAction('content.write', schema, formToObject(fd), async (ctx, d) => {
    const proj = must(await ctx.supabase.from('content_projects').select('product_id,objective,channel,tone,audience,brief').eq('id', d.id).single());
    const facts = await productFacts(ctx, proj.product_id);
    if (!facts) return { error: 'Link a product first — copy is generated only from verified product facts.' };
    const draft = generateCopy(facts, { platform: (proj.channel ?? 'instagram') as never, tone: (proj.tone ?? 'professional') as never, objective: (proj.objective ?? 'awareness') as never, audience: proj.audience, language: d.language });
    const brief = { ...(proj.brief as object), design: { template: 'product-launch', theme: 'forest', headline: draft.headline, subline: draft.subline, bullets: draft.bullets, cta: draft.cta, productName: facts.name } };
    must(await ctx.supabase.from('content_projects').update({ copy_draft: { ...draft, generated_at: new Date().toISOString(), status: 'draft' }, brief, status: 'draft' }).eq('id', d.id).select('id').single());
    return { ok: true, message: draft.warnings.length ? `Draft generated with ${draft.warnings.length} warning(s) — review before use.` : 'Draft generated. Review and edit before approval.' };
  }, P);
}

export async function saveCaption(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({ id: uuid, caption: z.string().max(3000), hashtags: z.string().max(400).optional() });
  return runAction('content.write', schema, formToObject(fd), async (ctx, d) => {
    const proj = must(await ctx.supabase.from('content_projects').select('copy_draft,status').eq('id', d.id).single());
    const hashtags = (d.hashtags ?? '').split(/\s+/).filter((h) => /^#[\p{L}\p{N}_]{2,40}$/u.test(h)).slice(0, 10);
    must(await ctx.supabase.from('content_projects').update({ copy_draft: { ...(proj.copy_draft as object), caption: d.caption, hashtags, edited_at: new Date().toISOString() }, status: proj.status === 'approved' ? 'in_review' : proj.status }).eq('id', d.id).select('id').single());
    return { ok: true, message: proj.status === 'approved' ? 'Saved. Content returned to review because it changed after approval.' : 'Caption saved.' };
  }, P);
}

const designSchema = z.object({
  id: uuid,
  template: z.enum(TEMPLATES.map((t) => t.key) as [string, ...string[]]),
  theme: z.enum(Object.keys(THEMES) as [string, ...string[]]),
  headline: z.string().trim().min(2).max(120),
  subline: z.string().trim().max(220).optional(),
  bullets: z.string().max(400).optional().transform((v) => (v ?? '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 4)),
  cta: z.string().trim().max(40).optional(),
  media_id: z.string().uuid().optional().or(z.literal('')).transform((v) => v || null),
  slide_index: z.coerce.number().int().min(0).max(20).optional(),
  slide_total: z.coerce.number().int().min(0).max(20).optional(),
});

export async function saveDesign(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return runAction('content.write', designSchema, formToObject(fd), async (ctx, { id, ...design }) => {
    const proj = must(await ctx.supabase.from('content_projects').select('brief,status,product:products(name)').eq('id', id).single());
    const productName = (proj.product as { name: string } | null)?.name;
    must(await ctx.supabase.from('content_projects').update({ brief: { ...(proj.brief as object), design: { ...design, productName } }, status: proj.status === 'approved' ? 'in_review' : proj.status }).eq('id', id).select('id').single());
    return { ok: true, message: 'Design saved. Preview updated.' };
  }, P);
}

export async function exportImage(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({ id: uuid, format_key: z.enum(IMAGE_FORMATS.map((f) => f.key) as [string, ...string[]]), file_type: z.enum(['png', 'jpg']) });
  return runAction('content.write', schema, formToObject(fd), async (ctx, d) => {
    const design = await designFor(ctx, d.id);
    if (!design) return { error: 'Save a design first.' };
    const fmt = imageFormat(d.format_key)!;
    const img = await renderDesign(design, fmt.width, fmt.height, d.file_type);
    // Verify the bytes we are about to store really are what we claim.
    if (sniffMime(new Uint8Array(img.buffer)) !== img.mime) return { error: 'Render verification failed.' };
    const proj = must(await ctx.supabase.from('content_projects').select('product_id,title').eq('id', d.id).single());
    const objectPath = `content/${d.id}/${randomUUID()}-${fmt.width}x${fmt.height}.${d.file_type}`;
    const up = await ctx.supabase.storage.from('nexora-assets').upload(objectPath, img.buffer, { contentType: img.mime, upsert: false });
    if (up.error) return { error: 'Upload to storage failed.' };
    must(await ctx.supabase.from('content_assets').insert({
      content_project_id: d.id, product_id: proj.product_id, asset_type: 'image', storage_path: `nexora-assets/${objectPath}`, mime_type: img.mime, file_size_bytes: img.bytes,
      title: `${proj.title} · ${fmt.label}`, width: img.width, height: img.height, checksum_sha256: img.sha256, status: 'ready', created_by: ctx.userId,
      metadata: { template: design.template, theme: design.theme, verified: true, renderer: 'satori+resvg' },
    }).select('id').single());
    return { ok: true, message: `${d.file_type.toUpperCase()} ${img.width}×${img.height} exported and verified (${Math.round(img.bytes / 1024)} KB).` };
  }, P);
}

export async function queueVideo(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({ id: uuid, format_key: z.enum(['9x16', '1x1', '16x9']), duration: z.coerce.number().refine((v) => (VIDEO_DURATIONS as readonly number[]).includes(v)), theme: z.enum(['forest', 'light', 'lime']) });
  return runAction('content.write', schema, formToObject(fd), async (ctx, d) => {
    const proj = must(await ctx.supabase.from('content_projects').select('product_id,title,copy_draft').eq('id', d.id).single());
    const facts = await productFacts(ctx, proj.product_id);
    if (!facts) return { error: 'Link a product first — videos use verified product facts only.' };
    const fmt = videoFormat(d.format_key)!;
    const cta = String((proj.copy_draft as { cta?: string })?.cta ?? 'Learn more').slice(0, 40);
    must(await ctx.supabase.from('render_jobs').insert({
      content_project_id: d.id, product_id: proj.product_id, job_type: 'video', output_format: 'mp4', width: fmt.width, height: fmt.height, duration_seconds: d.duration,
      template_key: 'storyboard-v1', requested_by: ctx.userId, status: 'queued',
      input: { title: proj.title, theme: d.theme, cta, facts: { name: facts.name, short_description: facts.short_description, problem_statement: facts.problem_statement, benefits: facts.benefits ?? [], features: facts.features ?? [] } },
    }).select('id').single());
    return { ok: true, message: 'Video queued. The render worker will pick it up; progress appears below.' };
  }, P);
}

export async function setJobStatus(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return runAction('content.write', z.object({ id: uuid, to: z.enum(['canceled', 'queued']) }), formToObject(fd), async (ctx, d) => {
    must(await ctx.supabase.from('render_jobs').update({ status: d.to }).eq('id', d.id).select('id').single());
    return { ok: true, message: d.to === 'canceled' ? 'Job canceled.' : 'Job re-queued.' };
  }, P);
}

export async function setProjectStatus(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const raw = formToObject(fd);
  const schema = z.object({ id: uuid, to: z.enum(['draft', 'in_review', 'approved', 'archived']) });
  return runAction(raw.to === 'approved' ? 'content.approve' : 'content.write', schema, raw, async (ctx, d) => {
    must(await ctx.supabase.from('content_projects').update({ status: d.to }).eq('id', d.id).select('id').single());
    return { ok: true, message: d.to === 'approved' ? 'Content approved for publishing.' : `Status: ${d.to.replace('_', ' ')}.` };
  }, P);
}

export async function addCalendarEntry(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({ content_project_id: uuid, channel: z.enum(PLATFORMS), scheduled_at: z.string().min(10).transform((v) => new Date(v).toISOString()), caption: z.string().max(3000).optional() });
  return runAction('content.write', schema, formToObject(fd), async (ctx, d) => {
    const proj = must(await ctx.supabase.from('content_projects').select('product_id,status').eq('id', d.content_project_id).single());
    if (proj.status !== 'approved') return { error: 'Only approved content can be scheduled.' };
    must(await ctx.supabase.from('content_calendar').insert({ ...d, product_id: proj.product_id, status: 'planned' }).select('id').single());
    return { ok: true, message: 'Added to the content calendar. Publishing to social networks is manual.' };
  }, P);
}

export async function deleteAsset(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return runAction('content.write', z.object({ id: uuid }), formToObject(fd), async (ctx, d) => {
    const a = must(await ctx.supabase.from('content_assets').select('storage_path').eq('id', d.id).single());
    must(await ctx.supabase.from('content_assets').delete().eq('id', d.id).select('id'));
    const [bucket, ...rest] = (a.storage_path ?? '').split('/');
    if (bucket === 'nexora-assets') await ctx.supabase.storage.from(bucket).remove([rest.join('/')]);
    return { ok: true, message: 'Asset deleted.' };
  }, P);
}
