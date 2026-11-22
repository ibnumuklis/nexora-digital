import { NextResponse } from 'next/server';
import { clientIp, isSameOrigin, readJson, visitorHash } from '@/lib/http/request';
import { handleInquiry } from '@/lib/inquiries';
import { createSupabasePublicClient } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/env';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  if (!publicEnv()) return NextResponse.json({ error: 'Inquiry service is not configured.' }, { status: 503 });
  let body: unknown;
  try {
    body = await readJson(request);
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const outcome = await handleInquiry(body, { ip: clientIp(request.headers), visitorHash: visitorHash(request.headers), db: createSupabasePublicClient() });
  return NextResponse.json(outcome.body, { status: outcome.status });
}
