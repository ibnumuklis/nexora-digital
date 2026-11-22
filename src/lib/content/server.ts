import 'server-only';
import type { StaffContext } from '@/lib/auth/session';
import type { DesignInput } from './templates';
import { sniffMime } from '@/lib/security/files';

/** Load a product screenshot (from storage, via the user's session) as a data URI for the template. */
export async function loadMediaDataUri(ctx: StaffContext, mediaId: string | null | undefined): Promise<string | null> {
  if (!mediaId) return null;
  const { data: m } = await ctx.supabase.from('product_media').select('storage_path').eq('id', mediaId).maybeSingle();
  if (!m) return null;
  const [bucket, ...rest] = m.storage_path.split('/');
  if (bucket !== 'nexora-public' && bucket !== 'nexora-assets') return null;
  const { data } = await ctx.supabase.storage.from(bucket).download(rest.join('/'));
  if (!data || data.size > 5 * 1024 * 1024) return null;
  const bytes = new Uint8Array(await data.arrayBuffer());
  const mime = sniffMime(bytes);
  if (!mime || !mime.startsWith('image/')) return null;
  return `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`;
}

export async function designFor(ctx: StaffContext, projectId: string): Promise<DesignInput | null> {
  const { data: proj } = await ctx.supabase.from('content_projects').select('brief').eq('id', projectId).maybeSingle();
  const d = (proj?.brief as { design?: Record<string, unknown> } | null)?.design;
  if (!d) return null;
  return {
    template: d.template as DesignInput['template'], theme: d.theme as DesignInput['theme'], headline: String(d.headline ?? ''), subline: d.subline as string | undefined,
    bullets: d.bullets as string[] | undefined, cta: d.cta as string | undefined, productName: d.productName as string | undefined,
    slideIndex: (d.slide_index as number) || undefined, slideTotal: (d.slide_total as number) || undefined,
    imageDataUri: await loadMediaDataUri(ctx, d.media_id as string | null),
  };
}

