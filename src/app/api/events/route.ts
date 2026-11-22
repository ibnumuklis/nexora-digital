import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clientIp, isSameOrigin, readJson } from '@/lib/http/request';
import { rateLimit } from '@/lib/http/rate-limit';
import { createSupabasePublicClient } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/env';

export const runtime = 'nodejs';

const schema = z.object({
  event: z.enum(['page_view', 'product_view', 'search', 'cta_clicked', 'demo_cta_click', 'contact_cta_click', 'inquiry_submitted', 'content_downloaded']),
  path: z.string().max(300).optional(),
  productSlug: z.string().max(100).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional(),
  sessionHash: z.string().regex(/^[a-f0-9]{64}$/).optional().or(z.literal('')),
  source: z.string().max(80).optional(),
  metadata: z.record(z.string().max(40), z.union([z.string().max(120), z.number(), z.boolean()])).optional(),
});

/** First-party analytics intake. Requires the visitor's analytics consent cookie. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new NextResponse(null, { status: 403 });
  if (!/(?:^|;\s*)nx_consent=analytics/.test(request.headers.get('cookie') ?? '')) return new NextResponse(null, { status: 204 });
  if (!publicEnv()) return new NextResponse(null, { status: 204 });
  if (!rateLimit(`evt:${clientIp(request.headers)}`, 120, 60_000).allowed) return new NextResponse(null, { status: 429 });
  let parsed;
  try {
    parsed = schema.safeParse(await readJson(request, 4096));
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  const e = parsed.data;
  if (e.metadata && Object.keys(e.metadata).length > 10) return new NextResponse(null, { status: 400 });
  const { error } = await createSupabasePublicClient().rpc('track_event', {
    p_event: e.event, p_path: e.path ?? undefined, p_product_slug: e.productSlug ?? undefined,
    p_session_hash: e.sessionHash || undefined, p_source: e.source ?? undefined, p_metadata: e.metadata ?? {},
  });
  return new NextResponse(null, { status: error ? 502 : 204 });
}
