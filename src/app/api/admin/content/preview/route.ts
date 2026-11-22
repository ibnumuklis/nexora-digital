import { NextResponse } from 'next/server';
import { AuthzError, requirePermission } from '@/lib/auth/session';
import { designFor } from '@/lib/content/server';
import { imageFormat } from '@/lib/content/formats';
import { renderDesign } from '@/lib/content/render';

export const runtime = 'nodejs';

/** Authenticated live preview of a project's saved design (rendered by the same engine as exports). */
export async function GET(request: Request) {
  let ctx;
  try {
    ctx = await requirePermission('content.read');
  } catch (e) {
    return new NextResponse(null, { status: e instanceof AuthzError ? e.status : 403 });
  }
  const url = new URL(request.url);
  const id = url.searchParams.get('project') ?? '';
  const fmt = imageFormat(url.searchParams.get('format') ?? 'portrait');
  if (!/^[0-9a-f-]{36}$/.test(id) || !fmt) return new NextResponse(null, { status: 400 });
  const design = await designFor(ctx, id);
  if (!design) return new NextResponse(null, { status: 404 });
  // Preview at half resolution for speed; exports render at full size.
  const scale = 0.5;
  const w = Math.round(fmt.width * scale), h = Math.round(fmt.height * scale);
  const img = await renderDesign(design, w, h, 'png');
  return new NextResponse(new Uint8Array(img.buffer), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, no-store' } });
}
