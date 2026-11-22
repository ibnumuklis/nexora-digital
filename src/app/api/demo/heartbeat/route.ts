import { NextResponse } from 'next/server';
import { isSameOrigin, readJson } from '@/lib/http/request';
import { clearDemoCookie, demoHeartbeat, readDemoCookie } from '@/lib/demo/server';

export const runtime = 'nodejs';

/** Validates the session server-side. `activity: true` = the visitor interacted since last beat. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ status: 'invalid' }, { status: 403 });
  const c = await readDemoCookie();
  if (!c) return NextResponse.json({ status: 'invalid' }, { status: 401 });
  let activity = false;
  try {
    activity = (await readJson(request, 256) as { activity?: unknown }).activity === true;
  } catch {}
  try {
    const hb = await demoHeartbeat(c.sessionId, c.token, activity);
    if (hb.status !== 'active') {
      await clearDemoCookie();
      return NextResponse.json(hb, { status: 410, headers: { 'Cache-Control': 'no-store' } });
    }
    const { product_id: _p, ...safe } = hb;
    return NextResponse.json(safe, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 503 });
  }
}
