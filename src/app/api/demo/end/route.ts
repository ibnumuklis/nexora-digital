import { NextResponse } from 'next/server';
import { isSameOrigin } from '@/lib/http/request';
import { clearDemoCookie, readDemoCookie } from '@/lib/demo/server';
import { createSupabasePublicClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const c = await readDemoCookie();
  await clearDemoCookie();
  if (!c) return NextResponse.json({ ok: true });
  await createSupabasePublicClient().rpc('demo_end', { p_session_id: c.sessionId, p_token: c.token });
  return NextResponse.json({ ok: true });
}
