import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clientIp, isSameOrigin, readJson, visitorHash } from '@/lib/http/request';
import { rateLimit } from '@/lib/http/rate-limit';
import { createSupabasePublicClient } from '@/lib/supabase/server';
import { DEMO_ERRORS, setDemoCookie, type DemoSessionPayload } from '@/lib/demo/server';
import { publicEnv } from '@/lib/env';

export const runtime = 'nodejs';
const schema = z.object({ slug: z.string().max(100).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/) });

/** Start a demo session. The raw token goes only into an HttpOnly cookie, never to page JS. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ code: 'invalid', error: 'Invalid origin.' }, { status: 403 });
  if (!publicEnv()) return NextResponse.json({ code: 'not_configured', error: 'Demo service is not configured.' }, { status: 503 });
  const vh = visitorHash(request.headers);
  if (!vh) return NextResponse.json({ code: 'not_configured', error: 'Demo service is not configured.' }, { status: 503 });
  if (!rateLimit(`demo:${clientIp(request.headers)}`, 6, 60 * 60_000).allowed) {
    return NextResponse.json({ code: 'rate_limited', error: DEMO_ERRORS.rate_limited.message }, { status: 429 });
  }
  let body;
  try {
    body = schema.safeParse(await readJson(request, 1024));
  } catch {
    return NextResponse.json({ code: 'invalid', error: 'Invalid request.' }, { status: 400 });
  }
  if (!body.success) return NextResponse.json({ code: 'invalid', error: 'Invalid product.' }, { status: 400 });

  const { data, error } = await createSupabasePublicClient().rpc('demo_start', { p_slug: body.data.slug, p_visitor_hash: vh });
  if (error || !data) {
    const mapped = error ? DEMO_ERRORS[error.message] : undefined;
    return NextResponse.json({ code: mapped?.code ?? 'network', error: mapped?.message ?? 'The demo service is temporarily unavailable.' }, { status: mapped?.status ?? 503 });
  }
  const s = data as unknown as DemoSessionPayload;
  await setDemoCookie(s.session_id, s.token, s.duration_seconds);
  const { token: _omit, ...safe } = s; // eslint-disable-line @typescript-eslint/no-unused-vars
  return NextResponse.json({ session: safe }, { headers: { 'Cache-Control': 'no-store' } });
}
