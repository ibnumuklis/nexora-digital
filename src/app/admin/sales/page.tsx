import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { requirePagePermission } from '@/lib/auth/session';
import { QUOTE_LABELS, QUOTE_STATUSES } from '@/lib/crm';
import { formatPrice } from '@/lib/catalog';
import { PageHeader, Badge, EmptyState } from '@/components/ui';
import { DataTable, Td, fmtDate, StatCard } from '@/components/admin/table';

export const metadata = { title: 'Sales & quotes' };

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ status?: string; type?: string }> }) {
  const ctx = await requirePagePermission('crm.read');
  const sp = await searchParams;
  let q = ctx.supabase.from('sales_inquiries').select('id,inquiry_type,status,quoted_amount,currency,valid_until,created_at,budget_range,timeline,lead:leads(id,full_name,company),product:products(name)').order('created_at', { ascending: false }).limit(200);
  if (sp.status && (QUOTE_STATUSES as readonly string[]).includes(sp.status)) q = q.eq('status', sp.status);
  if (sp.type && /^[a-z_]{3,30}$/.test(sp.type)) q = q.eq('inquiry_type', sp.type);
  const { data: rows } = await q;
  const { data: all } = await ctx.supabase.from('sales_inquiries').select('status,quoted_amount,currency');
  const open = (all ?? []).filter((r) => !['accepted', 'rejected', 'closed'].includes(r.status));
  const pipelineIdr = open.filter((r) => r.currency === 'IDR' && r.quoted_amount).reduce((a, r) => a + Number(r.quoted_amount), 0);
  const won = (all ?? []).filter((r) => r.status === 'accepted').length;

  return (
    <>
      <PageHeader eyebrow="Sales" title="Inquiries & quotations" description="Workflow: New → Qualifying → Drafting → Pending approval → Approved (admin) → Sent → Accepted/Rejected. No payments are processed here." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Open inquiries" value={open.length} />
        <StatCard label="Quoted pipeline (IDR)" value={formatPrice(pipelineIdr, 'IDR') ?? 'IDR 0'} note="Sum of open quotes with an amount" />
        <StatCard label="Accepted" value={won} />
      </div>
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Filter by status">
        <Link href="/admin/sales" className={`rounded-full border px-3 py-1.5 text-xs ${!sp.status ? 'border-accent text-accent' : 'border-line'}`}>All</Link>
        {QUOTE_STATUSES.map((s) => <Link key={s} href={`/admin/sales?status=${s}`} className={`rounded-full border px-3 py-1.5 text-xs ${sp.status === s ? 'border-accent text-accent' : 'border-line'}`}>{QUOTE_LABELS[s]}</Link>)}
      </nav>
      {rows?.length ? (
        <DataTable caption="Sales inquiries" head={['Client', 'Type', 'Product', 'Status', 'Quote', 'Budget / timeline', 'Received']}>
          {rows.map((r) => {
            const lead = r.lead as { id: string; full_name: string; company: string | null } | null;
            return (
              <tr key={r.id} className="hover:bg-surface-2/40">
                <Td><Link href={`/admin/sales/${r.id}`} className="font-semibold hover:text-accent">{lead?.full_name ?? 'Unknown'}</Link><p className="text-xs text-muted">{lead?.company}</p></Td>
                <Td className="text-xs">{r.inquiry_type.replace('_', ' ')}</Td>
                <Td>{(r.product as { name: string } | null)?.name ?? '—'}</Td>
                <Td><Badge tone={r.status === 'accepted' ? 'green' : r.status === 'rejected' ? 'red' : r.status === 'pending_approval' ? 'amber' : 'neutral'}>{QUOTE_LABELS[r.status as keyof typeof QUOTE_LABELS] ?? r.status}</Badge></Td>
                <Td>{formatPrice(r.quoted_amount, r.currency) ?? '—'}</Td>
                <Td className="text-xs text-muted">{[r.budget_range, r.timeline].filter(Boolean).join(' · ') || '—'}</Td>
                <Td className="whitespace-nowrap text-xs text-muted">{fmtDate(r.created_at)}</Td>
              </tr>
            );
          })}
        </DataTable>
      ) : <EmptyState icon={<Receipt />} title="No inquiries yet">Quotation, consultation, custom development, license and partnership requests appear here.</EmptyState>}
    </>
  );
}
