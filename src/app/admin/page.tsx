import Link from 'next/link';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { requirePagePermission } from '@/lib/auth/session';
import { can, ROLE_LABELS } from '@/lib/auth/rbac';
import { PageHeader, Alert } from '@/components/ui';
import { StatCard, fmtDate } from '@/components/admin/table';

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const ctx = await requirePagePermission('catalog.read');
  const { denied } = await searchParams;
  const db = ctx.supabase;
  const head = { count: 'exact' as const, head: true };
  const [products, published, drafts, leadsNew, inquiries, jobs, demosActive] = await Promise.all([
    db.from('products').select('id', head),
    db.from('products').select('id', head).eq('publication_status', 'published'),
    db.from('products').select('id', head).eq('publication_status', 'draft'),
    can(ctx.role, 'crm.read') ? db.from('leads').select('id', head).eq('status', 'new') : null,
    can(ctx.role, 'crm.read') ? db.from('sales_inquiries').select('id', head).in('status', ['new', 'qualifying', 'drafting', 'pending_approval']) : null,
    can(ctx.role, 'content.read') ? db.from('render_jobs').select('id', head).in('status', ['queued', 'processing']) : null,
    can(ctx.role, 'demo.manage') ? db.from('demo_sessions').select('id', head).eq('status', 'active') : null,
  ]);
  const { data: followUps } = can(ctx.role, 'crm.read')
    ? await db.from('leads').select('id,full_name,company,next_follow_up_at,status').not('next_follow_up_at', 'is', null).lte('next_follow_up_at', new Date(Date.now() + 2 * 86400000).toISOString()).not('status', 'in', '(won,lost)').order('next_follow_up_at').limit(6)
    : { data: [] };
  const { data: unverified } = await db.from('products').select('id,name,status').is('verified_at', null).order('name').limit(10);

  return (
    <>
      <PageHeader eyebrow={ROLE_LABELS[ctx.role]} title="Overview" description="Live figures from the NEXORA database. Metrics appear only when real data exists." />
      {denied && <Alert tone="warning" className="mb-6">Your role cannot open that section.</Alert>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Products" value={products.count ?? 0} note={`${published.count ?? 0} published · ${drafts.count ?? 0} draft`} />
        {leadsNew && <StatCard label="New leads" value={leadsNew.count ?? 0} note="Status: new" />}
        {inquiries && <StatCard label="Open quotes & inquiries" value={inquiries.count ?? 0} />}
        {jobs && <StatCard label="Render jobs in progress" value={jobs.count ?? 0} />}
        {demosActive && <StatCard label="Active demo sessions" value={demosActive.count ?? 0} />}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {can(ctx.role, 'crm.read') && (
          <section className="card p-6">
            <h2 className="font-semibold">Follow-ups due (next 48h)</h2>
            {followUps?.length ? (
              <ul className="mt-4 divide-y divide-line">{followUps.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-3 text-sm"><Link href={`/admin/leads/${l.id}`} className="font-medium hover:text-accent">{l.full_name}{l.company && <span className="text-muted"> · {l.company}</span>}</Link><span className="text-xs text-muted">{fmtDate(l.next_follow_up_at, true)}</span></li>
              ))}</ul>
            ) : <p className="mt-3 text-sm text-muted">No follow-ups scheduled.</p>}
          </section>
        )}
        <section className="card p-6">
          <h2 className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} className="text-amber-600" aria-hidden /> Products awaiting verification</h2>
          <p className="mt-1 text-xs text-muted">A product can be published only after an admin verifies its facts, assets and URLs.</p>
          {unverified?.length ? (
            <ul className="mt-4 divide-y divide-line">{unverified.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3 text-sm"><Link href={`/admin/products/${p.id}`} className="font-medium hover:text-accent">{p.name}</Link><ArrowUpRight size={14} className="text-muted" aria-hidden /></li>
            ))}</ul>
          ) : <p className="mt-3 text-sm text-muted">All products are verified.</p>}
        </section>
      </div>
    </>
  );
}
