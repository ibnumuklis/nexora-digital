import { NextResponse } from 'next/server';
import { AuthzError, requirePermission } from '@/lib/auth/session';

export const runtime = 'nodejs';

/**
 * Download a generated asset. The file must be recorded as `ready` AND exist in private storage;
 * access is granted through a 60-second signed URL. No download link is ever shown for missing files.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let ctx;
  try {
    ctx = await requirePermission('content.read');
  } catch (e) {
    return NextResponse.json({ error: 'Forbidden' }, { status: e instanceof AuthzError ? e.status : 403 });
  }
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const { data: a } = await ctx.supabase.from('content_assets').select('storage_path,status,mime_type,title,width,height').eq('id', id).maybeSingle();
  if (!a || a.status !== 'ready' || !a.storage_path) return NextResponse.json({ error: 'Asset not available' }, { status: 404 });
  const [bucket, ...rest] = a.storage_path.split('/');
  if (bucket !== 'nexora-assets') return NextResponse.json({ error: 'Asset not available' }, { status: 404 });
  const ext = a.mime_type === 'video/mp4' ? 'mp4' : a.mime_type === 'image/jpeg' ? 'jpg' : 'png';
  const name = `nexora-${(a.title ?? 'asset').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}-${a.width}x${a.height}.${ext}`;
  const { data, error } = await ctx.supabase.storage.from(bucket).createSignedUrl(rest.join('/'), 60, { download: name });
  if (error || !data) return NextResponse.json({ error: 'File missing in storage' }, { status: 404 });
  return NextResponse.redirect(data.signedUrl, { status: 302, headers: { 'Cache-Control': 'no-store' } });
}
