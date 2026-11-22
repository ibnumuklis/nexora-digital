import { NextResponse } from 'next/server';
import { clearDemoCookie, demoHeartbeat, readDemoCookie } from '@/lib/demo/server';
import { buildSandboxView, sandboxModules } from '@/lib/demo/sandbox';
import { createSupabasePublicClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Protected sandbox data. EVERY request re-validates the session (expiry, idle, token, product scope)
 * in the database before any content is produced.
 */
export async function GET(request: Request) {
  const c = await readDemoCookie();
  if (!c) return NextResponse.json({ status: 'invalid' }, { status: 401 });
  const url = new URL(request.url);
  const slug = url.searchParams.get('product') ?? '';
  const moduleKey = url.searchParams.get('module') ?? 'm0';
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || !/^m[0-7]$/.test(moduleKey)) return NextResponse.json({ status: 'invalid' }, { status: 400 });

  let hb;
  try {
    hb = await demoHeartbeat(c.sessionId, c.token, true);
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 503 });
  }
  if (hb.status !== 'active') {
    await clearDemoCookie();
    return NextResponse.json({ status: hb.status, reason: hb.reason ?? null }, { status: 410 });
  }
  // Product scope check: the session's product must be the one requested.
  const db = createSupabasePublicClient();
  const { data: product } = await db.from('products').select('id,slug,features:product_features(title,sort_order)').eq('slug', slug).eq('publication_status', 'published').maybeSingle();
  if (!product || product.id !== hb.product_id) return NextResponse.json({ status: 'forbidden' }, { status: 403 });

  const titles = [...(product.features ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((f) => f.title);
  const modules = sandboxModules(titles);
  const mod = modules.find((m) => m.key === moduleKey);
  if (!mod) return NextResponse.json({ status: 'invalid' }, { status: 400 });
  return NextResponse.json(
    { status: 'active', modules, view: buildSandboxView(c.sessionId, mod), remaining_seconds: hb.remaining_seconds, idle_remaining_seconds: hb.idle_remaining_seconds },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
