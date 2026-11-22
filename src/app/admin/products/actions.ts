'use server';
import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { formToObject, must, runAction, type ActionResult } from '@/lib/admin/action';
import { slugSchema } from '@/lib/validation/forms';
import { validateUpload, EXT } from '@/lib/security/files';

const STATUSES = ['planning', 'prototype', 'development', 'beta', 'ready_for_demo', 'available', 'maintenance', 'discontinued'] as const;
const MODELS = ['saas', 'lifetime_license', 'custom_development', 'maintenance', 'white_label', 'hybrid'] as const;
const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const httpsUrl = z.string().trim().max(500).optional().transform((v) => (v ? v : null)).refine((v) => !v || /^https:\/\/[a-z0-9.-]+(:[0-9]+)?(\/.*)?$/i.test(v), 'Must be an https:// URL.');
const lines = (max: number) => z.string().max(4000).optional().transform((v) => (v ?? '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, max));
const P = ['/admin/products', '/products', '/'];

export async function createProduct(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({ name: z.string().trim().min(2).max(120), slug: slugSchema, category_id: z.string().uuid().optional().or(z.literal('')).transform((v) => v || null) });
  let id: string | undefined;
  const res = await runAction('catalog.write', schema, formToObject(fd), async (ctx, d) => {
    const row = must(await ctx.supabase.from('products').insert({ name: d.name, slug: d.slug, category_id: d.category_id, status: 'planning', publication_status: 'draft' }).select('id').single());
    id = row.id;
    return { ok: true, id: row.id };
  }, P);
  if (res.ok && id) redirect(`/admin/products/${id}`);
  return res;
}

const detailsSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  category_id: z.string().uuid().optional().or(z.literal('')).transform((v) => v || null),
  status: z.enum(STATUSES),
  pricing_model: z.enum(MODELS).optional().or(z.literal('')).transform((v) => v || null),
  short_description: opt(240),
  description: opt(8000),
  problem_statement: opt(1000),
  target_market: opt(200),
  benefits: lines(12),
  technology_stack: lines(15),
  application_url: httpsUrl,
  demo_url: httpsUrl,
  demo_video_url: httpsUrl,
  seo_title: opt(70),
  seo_description: opt(170),
  is_featured: z.preprocess((v) => v === 'on', z.boolean()),
  faq: z.string().max(8000).optional().transform((v, c) => {
    const out: { q: string; a: string }[] = [];
    for (const block of (v ?? '').split(/\n\s*\n/)) {
      const [q, ...a] = block.split('\n');
      if (!q?.trim()) continue;
      if (!a.join(' ').trim()) { c.addIssue({ code: 'custom', message: `FAQ "${q.trim().slice(0, 40)}" needs an answer on the next line.` }); return z.NEVER; }
      out.push({ q: q.trim().replace(/^Q:\s*/i, '').slice(0, 200), a: a.join(' ').trim().replace(/^A:\s*/i, '').slice(0, 1000) });
    }
    return out.slice(0, 15);
  }),
});

export async function updateProduct(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return runAction('catalog.write', detailsSchema, formToObject(fd), async (ctx, { id, ...d }) => {
    must(await ctx.supabase.from('products').update(d).eq('id', id).select('id').single());
    return { ok: true, message: 'Product saved.' };
  }, P);
}

/** Verification is an explicit admin attestation that facts, assets and URLs were checked. */
export async function setVerification(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({ id: z.string().uuid(), verified: z.enum(['true', 'false']), attest: z.preprocess((v) => v === 'on', z.boolean()) });
  return runAction('catalog.write', schema, formToObject(fd), async (ctx, d) => {
    if (d.verified === 'true' && !d.attest) return { error: 'Confirm that you checked the product facts, screenshots and URLs.' };
    const patch = d.verified === 'true' ? { verified_at: new Date().toISOString(), verified_by: ctx.userId } : { verified_at: null, verified_by: null, publication_status: 'draft', demo_enabled: false };
    must(await ctx.supabase.from('products').update(patch).eq('id', d.id).select('id').single());
    return { ok: true, message: d.verified === 'true' ? 'Marked as verified.' : 'Verification removed; product reverted to draft.' };
  }, P);
}

export async function setPublication(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({ id: z.string().uuid(), publication_status: z.enum(['draft', 'published', 'archived']) });
  return runAction('catalog.write', schema, formToObject(fd), async (ctx, d) => {
    const patch: { publication_status: string; published_at?: string; demo_enabled?: boolean } = { publication_status: d.publication_status };
    if (d.publication_status === 'published') patch.published_at = new Date().toISOString();
    else patch.demo_enabled = false;
    must(await ctx.supabase.from('products').update(patch).eq('id', d.id).select('id').single());
    return { ok: true, message: `Product is now ${d.publication_status}.` };
  }, P);
}

export async function deleteProduct(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({ id: z.string().uuid(), confirm_slug: z.string() });
  const res = await runAction('catalog.write', schema, formToObject(fd), async (ctx, d) => {
    const p = must(await ctx.supabase.from('products').select('slug,publication_status').eq('id', d.id).single());
    if (p.slug !== d.confirm_slug) return { error: 'Type the product slug exactly to confirm deletion.' };
    if (p.publication_status === 'published') return { error: 'Unpublish the product before deleting it.' };
    must(await ctx.supabase.from('products').delete().eq('id', d.id).select('id'));
    return { ok: true };
  }, P);
  if (res.ok) redirect('/admin/products?deleted=1');
  return res;
}

export async function addFeature(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({ product_id: z.string().uuid(), title: z.string().trim().min(2).max(120), description: opt(600), sort_order: z.coerce.number().int().min(0).max(999).default(0) });
  return runAction('catalog.media', schema, formToObject(fd), async (ctx, d) => {
    must(await ctx.supabase.from('product_features').insert(d).select('id').single());
    return { ok: true, message: 'Feature added.' };
  }, P);
}

export async function deleteFeature(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return runAction('catalog.write', z.object({ id: z.string().uuid() }), formToObject(fd), async (ctx, d) => {
    must(await ctx.supabase.from('product_features').delete().eq('id', d.id).select('id'));
    return { ok: true, message: 'Feature removed.' };
  }, P);
}

export async function savePricing(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({
    id: z.string().uuid().optional().or(z.literal('')).transform((v) => v || undefined),
    product_id: z.string().uuid(),
    name: z.string().trim().min(2).max(80),
    tier: z.enum(['starter', 'professional', 'enterprise', 'custom']),
    description: opt(500),
    billing_period: z.enum(['custom', 'monthly', 'yearly', 'one_time']),
    price_amount: z.string().trim().optional().transform((v) => (v ? Number(v.replace(/[^0-9.]/g, '')) : null)).refine((v) => v === null || (Number.isFinite(v) && v >= 0), 'Enter a valid amount or leave empty for “on request”.'),
    currency: z.enum(['IDR', 'USD']).default('IDR'),
    is_public: z.preprocess((v) => v === 'on', z.boolean()),
    sort_order: z.coerce.number().int().min(0).max(99).default(0),
  });
  return runAction('catalog.write', schema, formToObject(fd), async (ctx, { id, ...d }) => {
    if (id) must(await ctx.supabase.from('pricing_packages').update(d).eq('id', id).select('id').single());
    else must(await ctx.supabase.from('pricing_packages').insert(d).select('id').single());
    return { ok: true, message: 'Package saved.' };
  }, [...P, '/pricing']);
}

export async function deletePricing(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return runAction('catalog.write', z.object({ id: z.string().uuid() }), formToObject(fd), async (ctx, d) => {
    must(await ctx.supabase.from('pricing_packages').delete().eq('id', d.id).select('id'));
    return { ok: true, message: 'Package removed.' };
  }, P);
}

export async function uploadMedia(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({ product_id: z.string().uuid(), alt_text: z.string().trim().min(3, 'Describe the image for screen readers.').max(200), is_public: z.preprocess((v) => v === 'on', z.boolean()), sort_order: z.coerce.number().int().min(0).max(99).default(0) });
  const file = fd.get('file');
  return runAction('catalog.media', schema, formToObject(fd), async (ctx, d) => {
    if (!(file instanceof File)) return { error: 'Choose an image to upload.' };
    const v = await validateUpload(file, ['image/png', 'image/jpeg', 'image/webp'], 5 * 1024 * 1024);
    if (!v.ok) return { error: v.error };
    const bucket = d.is_public ? 'nexora-public' : 'nexora-assets';
    const objectPath = `products/${d.product_id}/${randomUUID()}.${EXT[v.mime]}`;
    const up = await ctx.supabase.storage.from(bucket).upload(objectPath, v.bytes, { contentType: v.mime, upsert: false, cacheControl: '31536000' });
    if (up.error) return { error: 'Upload failed. Check the file and your permissions.' };
    const ins = await ctx.supabase.from('product_media').insert({ product_id: d.product_id, media_type: 'image', storage_path: `${bucket}/${objectPath}`, alt_text: d.alt_text, is_public: d.is_public, sort_order: d.sort_order }).select('id').single();
    if (ins.error) {
      await ctx.supabase.storage.from(bucket).remove([objectPath]);
      throw ins.error;
    }
    return { ok: true, message: 'Image uploaded.' };
  }, P);
}

export async function deleteMedia(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return runAction('catalog.write', z.object({ id: z.string().uuid() }), formToObject(fd), async (ctx, d) => {
    const m = must(await ctx.supabase.from('product_media').select('storage_path').eq('id', d.id).single());
    const [bucket, ...rest] = m.storage_path.split('/');
    must(await ctx.supabase.from('product_media').delete().eq('id', d.id).select('id'));
    if (bucket === 'nexora-public' || bucket === 'nexora-assets') await ctx.supabase.storage.from(bucket).remove([rest.join('/')]);
    return { ok: true, message: 'Image removed.' };
  }, P);
}

export async function saveDemoPolicy(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({
    product_id: z.string().uuid(),
    enabled: z.preprocess((v) => v === 'on', z.boolean()),
    duration_minutes: z.coerce.number().int().min(5).max(10),
    idle_timeout_seconds: z.coerce.number().int().min(30).max(600),
    max_active_sessions: z.coerce.number().int().min(1).max(3),
    max_concurrent_sessions: z.coerce.number().int().min(1).max(500),
    sessions_per_visitor_per_hour: z.coerce.number().int().min(1).max(60),
    mode: z.enum(['sandbox', 'iframe']),
    iframe_url: httpsUrl,
    watermark_text: z.string().trim().min(5).max(80).refine((v) => /DEMO/i.test(v) && /NEXORA/i.test(v), 'Watermark must contain “DEMO” and “NEXORA”.'),
  });
  return runAction('demo.manage', schema, formToObject(fd), async (ctx, { product_id, enabled, ...d }) => {
    if (d.mode === 'iframe') {
      const allowed = (process.env.DEMO_IFRAME_HOSTS ?? '').split(',').map((h) => h.trim().toLowerCase()).filter(Boolean);
      const host = d.iframe_url ? new URL(d.iframe_url).hostname : '';
      if (!host || !allowed.some((a) => host === a || host.endsWith('.' + a))) return { error: 'The iframe host is not in DEMO_IFRAME_HOSTS. Only isolated, approved demo deployments may be embedded.' };
    }
    const product = must(await ctx.supabase.from('products').select('publication_status').eq('id', product_id).single());
    must(await ctx.supabase.from('demo_policies').upsert({ product_id, enabled, ...d }, { onConflict: 'product_id' }).select('id').single());
    if (enabled && product.publication_status !== 'published') return { ok: true, message: 'Policy saved. The demo stays off until the product is published.' };
    must(await ctx.supabase.from('products').update({ demo_enabled: enabled, default_demo_minutes: d.duration_minutes }).eq('id', product_id).select('id').single());
    return { ok: true, message: enabled ? 'Demo policy saved and demo enabled.' : 'Demo policy saved; demo disabled.' };
  }, P);
}
