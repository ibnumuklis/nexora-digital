import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requirePagePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { QUOTE_LABELS, QUOTE_NEXT } from '@/lib/crm';
import { formatPrice } from '@/lib/catalog';
import { ownerOptions } from '@/lib/admin/staff-options';
import { PageHeader, Badge, Alert } from '@/components/ui';
import { fmtDate } from '@/components/admin/table';
import { ActionForm, SelectInput, SubmitButton, TextArea, TextInput } from '@/components/admin/form';
import { transitionQuote, updateQuote } from '../actions';

export const metadata = { title: 'Quotation' };

export default async function QuoteDetail({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePagePermission('crm.read');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data: q } = await ctx.supabase.from('sales_inquiries').select('*,lead:leads(id,full_name,email,company),product:products(id,name)').eq('id', id).maybeSingle();
  if (!q) notFound();
  const product = q.product as { id: string; name: string } | null;
  const lead = q.lead as { id: string; full_name: string; email: string; company: string | null } | null;
  const { data: packages } = product ? await ctx.supabase.from('pricing_packages').select('id,name,price_amount,currency').eq('product_id', product.id).order('sort_order') : { data: [] };
  const w = can(ctx.role, 'crm.write');
  const owners = w ? await ownerOptions(ctx) : [];
  const editable = w && ['new', 'qualifying', 'drafting', 'rejected'].includes(q.status);
  const next = QUOTE_NEXT[q.status] ?? [];

  return (
    <>
      <Link href="/admin/sales" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-accent"><ArrowLeft size={14} aria-hidden /> Sales</Link>
      <PageHeader eyebrow={q.inquiry_type.replace('_', ' ')} title={lead ? `${lead.full_name}${lead.company ? ' · ' + lead.company : ''}` : 'Inquiry'}
        description={<span className="flex flex-wrap gap-2"><Badge tone="blue">{QUOTE_LABELS[q.status as keyof typeof QUOTE_LABELS] ?? q.status}</Badge>{q.approved_at && <Badge tone="green">approved {fmtDate(q.approved_at)}</Badge>}{q.sent_at && <Badge>sent {fmtDate(q.sent_at)}</Badge>}</span>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <section className="card p-6">
            <h2 className="font-semibold">Request</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div><dt className="text-muted">Product</dt><dd>{product?.name ?? '—'}</dd></div>
              <div><dt className="text-muted">Budget</dt><dd>{q.budget_range ?? '—'}</dd></div>
              <div><dt className="text-muted">Timeline</dt><dd>{q.timeline ?? '—'}</dd></div>
            </dl>
            <p className="mt-4 whitespace-pre-line rounded-2xl bg-surface-2/60 p-4 text-sm leading-6">{q.message}</p>
            {lead && <Link href={`/admin/leads/${lead.id}`} className="mt-4 inline-block text-sm font-semibold text-accent">Open lead timeline →</Link>}
          </section>
          <section className="card p-6">
            <h2 className="font-semibold">Quotation</h2>
            {!editable && <Alert tone="info" className="mt-3">{w ? 'Quotation is locked while pending approval or after approval. Move it back to Drafting to edit.' : 'Read-only for your role.'}</Alert>}
            <fieldset disabled={!editable} className="mt-4">
              <ActionForm action={updateQuote}>
                <input type="hidden" name="id" value={q.id} />
                <div className="grid gap-4 md:grid-cols-3">
                  <SelectInput name="pricing_package_id" label="Package" defaultValue={q.pricing_package_id ?? ''} options={[{ value: '', label: 'Custom scope' }, ...(packages ?? []).map((p) => ({ value: p.id, label: `${p.name}${p.price_amount !== null ? ' · ' + formatPrice(p.price_amount, p.currency) : ''}` }))]} />
                  <TextInput name="quoted_amount" label="Quoted amount" defaultValue={q.quoted_amount ?? ''} hint="Approved figure only" />
                  <SelectInput name="currency" label="Currency" defaultValue={q.currency} options={[{ value: 'IDR', label: 'IDR' }, { value: 'USD', label: 'USD' }]} />
                  <TextInput name="valid_until" label="Valid until" type="date" defaultValue={q.valid_until ?? ''} />
                  <SelectInput name="owner_id" label="Owner" defaultValue={q.owner_id ?? ''} options={[{ value: '', label: 'Unassigned' }, ...owners]} />
                </div>
                <TextArea name="proposal_notes" label="Scope & proposal notes" defaultValue={q.proposal_notes} rows={6} maxLength={5000} />
                {editable && <SubmitButton>Save quotation</SubmitButton>}
              </ActionForm>
            </fieldset>
          </section>
        </div>
        <aside className="card h-fit p-6">
          <h2 className="font-semibold">Workflow</h2>
          <p className="mt-1 text-xs text-muted">Approval is restricted to admins and recorded with approver and time.</p>
          <div className="mt-4 grid gap-2">
            {next.length === 0 && <p className="text-sm text-muted">This inquiry is closed.</p>}
            {next.map((to) => {
              const allowed = to === 'approved' ? can(ctx.role, 'sales.approve') : w;
              return allowed ? (
                <ActionForm key={to} action={transitionQuote} className="" confirm={to === 'approved' ? 'Approve this quotation amount and scope?' : undefined}>
                  <input type="hidden" name="id" value={q.id} /><input type="hidden" name="to" value={to} />
                  <SubmitButton variant={to === 'approved' || to === 'sent' ? 'primary' : 'outline'} className="w-full">→ {QUOTE_LABELS[to as keyof typeof QUOTE_LABELS]}</SubmitButton>
                </ActionForm>
              ) : <p key={to} className="text-xs text-muted">“{QUOTE_LABELS[to as keyof typeof QUOTE_LABELS]}” requires an admin.</p>;
            })}
          </div>
        </aside>
      </div>
    </>
  );
}
