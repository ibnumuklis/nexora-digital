import { z } from 'zod';
import { BarChart3, FlaskConical, Ruler } from 'lucide-react';
import { requirePagePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { buildRecommendations, dataSufficiency, type Overview } from '@/lib/analytics/recommendations';
import { formToObject, must, runAction, type ActionResult } from '@/lib/admin/action';
import { PageHeader, Badge, Alert, EmptyState } from '@/components/ui';
import { StatCard, DataTable, Td, fmtDate } from '@/components/admin/table';
import { ActionForm, SubmitButton } from '@/components/admin/form';

export const metadata = { title: 'Analytics' };

async function saveRecommendations(_: ActionResult, fd: FormData): Promise<ActionResult> {
  'use server';
  return runAction('insights.write', z.object({ days: z.coerce.number().int().min(7).max(365) }), formToObject(fd), async (ctx, d) => {
    const { data, error } = await ctx.supabase.rpc('analytics_overview', { p_days: d.days });
    if (error) throw error;
    const recs = buildRecommendations(data as unknown as Overview).filter((r) => r.type !== 'insufficient_data');
    if (!recs.length) return { error: 'Not enough data to generate recommendations.' };
    const now = new Date();
    must(await ctx.supabase.from('ai_recommendations').insert(recs.map((r) => ({
      product_id: r.product_id, recommendation_type: r.type, title: r.title, description: r.description, evidence: r.evidence, confidence: r.confidence,
      kind: r.kind, generated_by: 'rules-v1', period_start: new Date(now.getTime() - d.days * 86400000).toISOString(), period_end: now.toISOString(), created_by: ctx.userId,
    }))).select('id'));
    return { ok: true, message: `${recs.length} items saved with their evidence.` };
  }, ['/admin/analytics']);
}

async function setRecStatus(_: ActionResult, fd: FormData): Promise<ActionResult> {
  'use server';
  return runAction('insights.write', z.object({ id: z.string().uuid(), status: z.enum(['accepted', 'dismissed', 'done']) }), formToObject(fd), async (ctx, d) => {
    must(await ctx.supabase.from('ai_recommendations').update({ status: d.status }).eq('id', d.id).select('id').single());
  }, ['/admin/analytics']);
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const ctx = await requirePagePermission('insights.read');
  const days = [7, 30, 90].includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 30;
  const { data, error } = await ctx.supabase.rpc('analytics_overview', { p_days: days });
  const o = data as unknown as Overview | null;
  const { data: saved } = await ctx.supabase.from('ai_recommendations').select('*').order('created_at', { ascending: false }).limit(30);
  if (error || !o) return <Alert tone="error">Analytics could not be loaded.</Alert>;
  const suff = dataSufficiency(o);
  const live = buildRecommendations(o);
  const maxDay = Math.max(1, ...((o as unknown as { by_day: { events: number }[] }).by_day ?? []).map((d) => d.events));
  const byDay = (o as unknown as { by_day: { day: string; events: number; page_views: number }[] }).by_day ?? [];

  return (
    <>
      <PageHeader eyebrow="Marketing intelligence" title="Analytics" description="First-party, consent-based events only. Figures are computed directly from raw events; nothing is estimated or sampled."
        actions={<nav className="flex gap-1" aria-label="Period">{[7, 30, 90].map((d) => <a key={d} href={`?days=${d}`} className={`rounded-full px-3 py-2 text-xs font-semibold ${d === days ? 'bg-forest text-white dark:bg-lime dark:text-forest' : 'border border-line'}`}>{d} days</a>)}</nav>} />
      {!suff.sufficient && <Alert tone="warning" className="mb-6" title="Low data">{suff.reason}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Consented sessions" value={o.unique_sessions} note={`${o.days} days`} />
        <StatCard label="Events" value={o.total_events} />
        <StatCard label="Product views" value={o.by_event.product_view ?? 0} />
        <StatCard label="Demos started" value={o.by_event.demo_started ?? 0} />
        <StatCard label="Leads" value={o.leads.total} note="All sources" />
      </div>

      <section className="card mt-6 p-6">
        <h2 className="font-semibold">Daily events</h2>
        {byDay.length ? (
          <div className="mt-4 flex h-40 items-end gap-1" role="img" aria-label={`Daily events over ${days} days`}>
            {byDay.map((d) => <div key={d.day} title={`${d.day}: ${d.events} events, ${d.page_views} page views`} className="flex-1 rounded-t bg-emerald/70 hover:bg-emerald" style={{ height: `${Math.max(2, (d.events / maxDay) * 100)}%` }} />)}
          </div>
        ) : <EmptyState icon={<BarChart3 />} title="No events in this period">Events are recorded only for visitors who allow analytics.</EmptyState>}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-semibold">Funnel (sessions)</h2>
          <ol className="mt-4 grid gap-2 text-sm">
            {(['page_view', 'product_view', 'demo_cta_click', 'demo_started', 'inquiry_submitted'] as const).map((k) => (
              <li key={k} className="flex items-center gap-3"><span className="w-40 text-muted">{k.replace(/_/g, ' ')}</span><span className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2"><span className="block h-full bg-emerald" style={{ width: `${o.funnel.page_view ? Math.min(100, (o.funnel[k] / o.funnel.page_view) * 100) : 0}%` }} /></span><span className="w-12 text-right font-semibold">{o.funnel[k]}</span></li>
            ))}
          </ol>
        </section>
        <section className="card p-6">
          <h2 className="font-semibold">Traffic sources & lead stages</h2>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">{Object.entries(o.by_source).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([s, n]) => <div key={s} className="flex justify-between rounded-lg bg-surface-2/60 px-3 py-2"><dt className="truncate">{s}</dt><dd className="font-semibold">{n}</dd></div>)}</dl>
          <div className="mt-4 flex flex-wrap gap-2">{Object.entries(o.leads.by_status).map(([s, n]) => <Badge key={s}>{s}: {n}</Badge>)}</div>
        </section>
      </div>

      {o.by_product.length > 0 && (
        <section className="mt-6"><h2 className="mb-3 font-semibold">Product performance</h2>
          <DataTable caption="Product performance" head={['Product', 'Views', 'Demo clicks', 'Demos started', 'Inquiries']}>
            {o.by_product.map((p) => <tr key={p.product_id}><Td>{p.name}</Td><Td>{p.views}</Td><Td>{p.demo_clicks}</Td><Td>{p.demo_started}</Td><Td>{p.inquiries}</Td></tr>)}
          </DataTable>
        </section>
      )}

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Recommendations (rules-v1, live)</h2>
          {can(ctx.role, 'insights.write') && suff.sufficient && <ActionForm action={saveRecommendations} className=""><input type="hidden" name="days" value={days} /><SubmitButton variant="outline">Save snapshot with evidence</SubmitButton></ActionForm>}
        </div>
        <ul className="grid gap-3">
          {live.map((r, i) => (
            <li key={i} className={`card p-5 ${r.kind === 'hypothesis' ? 'border-dashed' : ''}`}>
              <div className="flex flex-wrap items-center gap-2">{r.kind === 'measured' ? <Badge tone="blue"><Ruler size={11} aria-hidden /> measured fact</Badge> : <Badge tone="amber"><FlaskConical size={11} aria-hidden /> hypothesis</Badge>}<h3 className="font-semibold">{r.title}</h3></div>
              <p className="mt-2 text-sm leading-6 text-muted">{r.description}</p>
              <p className="mt-2 font-mono text-[11px] text-muted">evidence: {Object.entries(r.evidence).map(([k, v]) => `${k}=${v}`).join(' · ')}</p>
            </li>
          ))}
        </ul>
      </section>

      {saved?.length ? (
        <section className="mt-8"><h2 className="mb-3 font-semibold">Saved snapshots</h2>
          <DataTable caption="Saved recommendations" head={['Item', 'Kind', 'Period', 'Status', '']}>
            {saved.map((r) => (
              <tr key={r.id}><Td><p className="font-medium">{r.title}</p><p className="text-xs text-muted">{r.description}</p></Td><Td><Badge tone={r.kind === 'measured' ? 'blue' : 'amber'}>{r.kind}</Badge></Td><Td className="text-xs">{fmtDate(r.period_start)} – {fmtDate(r.period_end)}</Td><Td><Badge>{r.status}</Badge></Td>
                <Td>{can(ctx.role, 'insights.write') && r.status === 'new' && <div className="flex gap-1">{(['accepted', 'dismissed'] as const).map((s) => <ActionForm key={s} action={setRecStatus} className=""><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value={s} /><SubmitButton variant="ghost" className="min-h-[30px] text-xs">{s}</SubmitButton></ActionForm>)}</div>}</Td></tr>
            ))}
          </DataTable>
        </section>
      ) : null}
    </>
  );
}
