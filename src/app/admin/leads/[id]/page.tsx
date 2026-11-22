import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { requirePagePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { ACTIVITY_LABELS, ACTIVITY_TYPES, LEAD_STAGES, QUOTE_LABELS, STAGE_LABELS, scoreRuleLabel } from '@/lib/crm';
import { ownerOptions } from '@/lib/admin/staff-options';
import { PageHeader, Badge, Alert } from '@/components/ui';
import { fmtDate } from '@/components/admin/table';
import { ActionForm, SelectInput, SubmitButton, TextArea, TextInput } from '@/components/admin/form';
import { addActivity, deleteLead, updateLead } from '../actions';

export const metadata = { title: 'Lead' };

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePagePermission('crm.read');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = ctx.supabase;
  const [{ data: l }, { data: acts }, { data: inqs }] = await Promise.all([
    db.from('leads').select('*,product:products(name,slug)').eq('id', id).maybeSingle(),
    db.from('lead_activities').select('*').eq('lead_id', id).order('created_at', { ascending: false }).limit(200),
    db.from('sales_inquiries').select('id,inquiry_type,status,created_at,quoted_amount,currency').eq('lead_id', id).order('created_at', { ascending: false }),
  ]);
  if (!l) notFound();
  const w = can(ctx.role, 'crm.write');
  const owners = w ? await ownerOptions(ctx) : [];
  const reasons = Array.isArray(l.score_reasons) ? (l.score_reasons as { rule: string; points: number }[]) : [];
  const toLocal = (v: string | null) => (v ? new Date(new Date(v).getTime() + 7 * 3600_000).toISOString().slice(0, 16) : '');

  return (
    <>
      <Link href="/admin/leads" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-accent"><ArrowLeft size={14} aria-hidden /> Leads</Link>
      <PageHeader eyebrow={`Lead · ${l.source}`} title={l.full_name} description={<span className="flex flex-wrap gap-2"><Badge tone="blue">{STAGE_LABELS[l.status as keyof typeof STAGE_LABELS] ?? l.status}</Badge><Badge>score {l.score}</Badge>{l.consent_marketing ? <Badge tone="green">marketing consent</Badge> : <Badge>no marketing consent</Badge>}</span>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="grid gap-6">
          <section className="card p-6">
            <h2 className="font-semibold">Contact & need</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-muted">Email</dt><dd className="mt-1 flex items-center gap-2"><Mail size={14} aria-hidden /><a href={`mailto:${l.email}`} className="hover:text-accent">{l.email}</a></dd></div>
              <div><dt className="text-muted">Phone</dt><dd className="mt-1 flex items-center gap-2"><Phone size={14} aria-hidden />{l.phone ?? '—'}</dd></div>
              <div><dt className="text-muted">Company</dt><dd className="mt-1">{l.company ?? '—'}</dd></div>
              <div><dt className="text-muted">Industry</dt><dd className="mt-1">{l.industry ?? '—'}</dd></div>
              <div><dt className="text-muted">Product interest</dt><dd className="mt-1">{(l.product as { name: string } | null)?.name ?? l.interest_label ?? '—'}</dd></div>
              <div><dt className="text-muted">Privacy consent</dt><dd className="mt-1">{l.privacy_consent ? `Yes · ${fmtDate(l.privacy_consented_at, true)}` : 'No'}</dd></div>
            </dl>
            {l.need_description && <p className="mt-5 whitespace-pre-line rounded-2xl bg-surface-2/60 p-4 text-sm leading-6">{l.need_description}</p>}
            <p className="mt-4 text-xs text-muted">Outbound email/WhatsApp is not automated. Contact the lead with your own tools, then log the activity here{!l.consent_marketing && ' — do not add this contact to marketing campaigns'}.</p>
          </section>

          <section className="card p-6">
            <h2 className="font-semibold">Activity timeline</h2>
            {w && (
              <div className="mt-4 rounded-2xl bg-surface-2/50 p-4">
                <ActionForm action={addActivity} resetOnSuccess>
                  <input type="hidden" name="lead_id" value={l.id} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectInput name="activity_type" label="Type" options={ACTIVITY_TYPES.map((t) => ({ value: t, label: ACTIVITY_LABELS[t] }))} />
                    <TextInput name="due_at" label="Due (follow-up)" type="datetime-local" />
                  </div>
                  <TextArea name="notes" label="Notes" rows={3} required maxLength={5000} />
                  <SubmitButton variant="outline">Log activity</SubmitButton>
                </ActionForm>
              </div>
            )}
            <ol className="mt-5 grid gap-4 border-l border-line pl-5">
              {(acts ?? []).map((a) => {
                const md = (a.metadata ?? {}) as { from?: string; to?: string };
                return (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
                    <p className="text-xs text-muted">{fmtDate(a.created_at, true)} · {ACTIVITY_LABELS[a.activity_type] ?? a.activity_type}</p>
                    <p className="mt-1 text-sm">{a.activity_type === 'status_change' ? `${STAGE_LABELS[md.from as keyof typeof STAGE_LABELS] ?? md.from} → ${STAGE_LABELS[md.to as keyof typeof STAGE_LABELS] ?? md.to}` : a.notes}</p>
                    {a.due_at && <p className="text-xs text-muted">Due {fmtDate(a.due_at, true)}</p>}
                  </li>
                );
              })}
              <li className="relative"><span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-line" aria-hidden /><p className="text-xs text-muted">{fmtDate(l.created_at, true)} · Lead created ({l.source})</p></li>
            </ol>
          </section>
        </div>

        <aside className="grid h-fit gap-6">
          <section className="card p-6">
            <h2 className="font-semibold">Pipeline</h2>
            {w ? (
              <ActionForm action={updateLead} className="mt-4 grid gap-3">
                <input type="hidden" name="id" value={l.id} />
                <SelectInput name="status" label="Stage" defaultValue={l.status} options={LEAD_STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] }))} />
                <SelectInput name="owner_id" label="Owner" defaultValue={l.owner_id ?? ''} options={[{ value: '', label: 'Unassigned' }, ...owners]} />
                <TextInput name="next_follow_up_at" label="Next follow-up" type="datetime-local" defaultValue={toLocal(l.next_follow_up_at)} />
                <TextInput name="lost_reason" label="Lost reason" defaultValue={l.lost_reason} maxLength={300} hint="Required when stage is Lost." />
                <SubmitButton>Save</SubmitButton>
              </ActionForm>
            ) : <Alert tone="info" className="mt-4">Read-only for your role.</Alert>}
          </section>
          <section className="card p-6">
            <h2 className="font-semibold">Score breakdown</h2>
            <ul className="mt-3 grid gap-1 text-sm">{reasons.length ? reasons.map((r) => <li key={r.rule} className="flex justify-between"><span>{scoreRuleLabel(r.rule)}</span><span className="font-semibold">+{r.points}</span></li>) : <li className="text-muted">No scoring rules matched.</li>}</ul>
            <p className="mt-3 text-xs text-muted">Internal prioritisation aid based on the rules above — not a verified prediction.</p>
          </section>
          <section className="card p-6">
            <h2 className="font-semibold">Inquiries & quotes</h2>
            <ul className="mt-3 grid gap-2 text-sm">{inqs?.length ? inqs.map((i) => <li key={i.id}><Link href={`/admin/sales/${i.id}`} className="flex justify-between hover:text-accent"><span>{i.inquiry_type.replace('_', ' ')}</span><span className="text-xs text-muted">{QUOTE_LABELS[i.status as keyof typeof QUOTE_LABELS] ?? i.status}</span></Link></li>) : <li className="text-muted">None.</li>}</ul>
          </section>
          {can(ctx.role, 'crm.delete') && (
            <section className="card p-6">
              <h2 className="font-semibold text-red-700 dark:text-red-300">Erase lead</h2>
              <p className="mt-1 text-xs text-muted">For data-deletion requests. Removes the lead and its activity timeline permanently; the erasure is audited.</p>
              <ActionForm action={deleteLead} className="mt-3" confirm="Permanently erase this lead and its history?"><input type="hidden" name="id" value={l.id} /><SubmitButton variant="danger">Erase permanently</SubmitButton></ActionForm>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
