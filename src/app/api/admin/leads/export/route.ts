import { NextResponse } from 'next/server';
import { AuthzError, requirePermission } from '@/lib/auth/session';
import { LEAD_STAGES, toCsv } from '@/lib/crm';

export const runtime = 'nodejs';
const COLUMNS = ['created_at', 'full_name', 'email', 'phone', 'company', 'industry', 'source', 'status', 'score', 'consent_marketing', 'privacy_consented_at', 'next_follow_up_at', 'need_description'];

/** Role-restricted, audited CSV export. Marketing consent column included so campaigns can respect it. */
export async function GET(request: Request) {
  let ctx;
  try {
    ctx = await requirePermission('crm.export');
  } catch (e) {
    return NextResponse.json({ error: 'Forbidden' }, { status: e instanceof AuthzError ? e.status : 403 });
  }
  const url = new URL(request.url);
  let q = ctx.supabase.from('leads').select(COLUMNS.join(',')).order('created_at', { ascending: false }).limit(5000);
  const status = url.searchParams.get('status');
  if (status && (LEAD_STAGES as readonly string[]).includes(status)) q = q.eq('status', status);
  if (url.searchParams.get('mine')) q = q.eq('owner_id', ctx.userId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  await ctx.supabase.rpc('log_audit_event', { p_action: 'lead_export', p_entity_type: 'leads', p_metadata: { rows: rows.length, status: status ?? 'all' } });
  return new NextResponse(toCsv(rows, COLUMNS), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="nexora-leads-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' },
  });
}
