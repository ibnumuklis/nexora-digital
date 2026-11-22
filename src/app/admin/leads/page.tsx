import Link from 'next/link';
import { Download, Users } from 'lucide-react';
import { requirePagePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { LEAD_STAGES, STAGE_LABELS } from '@/lib/crm';
import { PageHeader, Badge, EmptyState } from '@/components/ui';
import { DataTable, Td, fmtDate } from '@/components/admin/table';
import { ActionForm, Checkbox, SubmitButton, TextArea, TextInput } from '@/components/admin/form';
import { createManualLead } from './actions';

export const metadata = { title: 'Leads & CRM' };
const PAGE = 50;

type SP = Promise<{ status?: string; source?: string; mine?: string; q?: string; page?: string; sort?: string }>;

export default async function LeadsPage({ searchParams }: { searchParams: SP }) {
  const ctx = await requirePagePermission('crm.read');
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const db = ctx.supabase;
  let q = db.from('leads').select('id,full_name,email,company,source,status,score,owner_id,next_follow_up_at,created_at,product:products(name)', { count: 'exact' });
  if (sp.status && (LEAD_STAGES as readonly string[]).includes(sp.status)) q = q.eq('status', sp.status);
  if (sp.source && /^[a-z_]{2,30}$/.test(sp.source)) q = q.eq('source', sp.source);
  if (sp.mine) q = q.eq('owner_id', ctx.userId);
  if (sp.q) {
    const term = sp.q.replace(/[%_,()*]/g, '').slice(0, 60);
    q = q.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,company.ilike.%${term}%`);
  }
  q = sp.sort === 'score' ? q.order('score', { ascending: false }) : sp.sort === 'follow' ? q.order('next_follow_up_at', { ascending: true, nullsFirst: false }) : q.order('created_at', { ascending: false });
  const [{ data: leads, count }, ...stageCounts] = await Promise.all([
    q.range((page - 1) * PAGE, page * PAGE - 1),
    ...LEAD_STAGES.map((s) => db.from('leads').select('id', { count: 'exact', head: true }).eq('status', s)),
  ]);
  const total = count ?? 0;
  const qs = (extra: Record<string, string | undefined>) => {
    const u = new URLSearchParams(Object.entries({ ...sp, ...extra }).filter(([, v]) => v) as [string, string][]);
    return `?${u.toString()}`;
  };

  return (
    <>
      <PageHeader eyebrow="CRM" title="Leads" description="Website inquiries and manually added contacts. Score = transparent rule-based prioritisation aid, not a prediction."
        actions={can(ctx.role, 'crm.export') ? <a href={`/api/admin/leads/export${qs({ page: undefined })}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold hover:border-accent"><Download size={15} aria-hidden /> Export CSV</a> : undefined} />

      <nav aria-label="Pipeline stages" className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        <Link href={qs({ status: undefined, page: undefined })} className={`card p-3 text-center ${!sp.status ? 'ring-2 ring-accent' : ''}`}><p className="text-xs text-muted">All</p><p className="font-display text-xl font-semibold">{stageCounts.reduce((a, r) => a + (r.count ?? 0), 0)}</p></Link>
        {LEAD_STAGES.map((s, i) => (
          <Link key={s} href={qs({ status: s, page: undefined })} className={`card p-3 text-center ${sp.status === s ? 'ring-2 ring-accent' : ''}`}><p className="text-xs text-muted">{STAGE_LABELS[s]}</p><p className="font-display text-xl font-semibold">{stageCounts[i].count ?? 0}</p></Link>
        ))}
      </nav>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div>
          <form role="search" className="mb-4 flex flex-wrap gap-2">
            {sp.status && <input type="hidden" name="status" value={sp.status} />}
            <input name="q" defaultValue={sp.q} placeholder="Name, email or company" aria-label="Search leads" className="min-h-[44px] flex-1 rounded-xl border border-line bg-surface px-4 text-sm" />
            <select name="sort" defaultValue={sp.sort ?? ''} aria-label="Sort" className="min-h-[44px] rounded-xl border border-line bg-surface px-3 text-sm"><option value="">Newest</option><option value="score">Highest score</option><option value="follow">Follow-up date</option></select>
            <label className="flex min-h-[44px] items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm"><input type="checkbox" name="mine" value="1" defaultChecked={!!sp.mine} className="accent-emerald" /> Mine</label>
            <button className="min-h-[44px] rounded-xl bg-forest px-4 text-sm font-semibold text-white dark:bg-lime dark:text-forest">Apply</button>
          </form>
          {leads?.length ? (
            <DataTable caption="Leads" head={['Contact', 'Interest', 'Source', 'Stage', 'Score', 'Follow-up', 'Received']}>
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-surface-2/40">
                  <Td><Link href={`/admin/leads/${l.id}`} className="font-semibold hover:text-accent">{l.full_name}</Link><p className="text-xs text-muted">{l.company ?? l.email}</p></Td>
                  <Td>{(l.product as { name: string } | null)?.name ?? <span className="text-muted">—</span>}</Td>
                  <Td className="text-xs">{l.source}</Td>
                  <Td><Badge tone={l.status === 'won' ? 'green' : l.status === 'lost' ? 'red' : l.status === 'new' ? 'blue' : 'neutral'}>{STAGE_LABELS[l.status as keyof typeof STAGE_LABELS] ?? l.status}</Badge></Td>
                  <Td><span className="font-semibold">{l.score}</span></Td>
                  <Td className={`whitespace-nowrap text-xs ${l.next_follow_up_at && new Date(l.next_follow_up_at) < new Date() ? 'font-semibold text-red-600' : 'text-muted'}`}>{fmtDate(l.next_follow_up_at)}</Td>
                  <Td className="whitespace-nowrap text-xs text-muted">{fmtDate(l.created_at)}</Td>
                </tr>
              ))}
            </DataTable>
          ) : <EmptyState icon={<Users />} title="No leads yet">Inquiries submitted on the website appear here automatically.</EmptyState>}
          {total > PAGE && (
            <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted">Page {page} of {Math.ceil(total / PAGE)} · {total} leads</span>
              <span className="flex gap-2">
                {page > 1 && <Link href={qs({ page: String(page - 1) })} className="rounded-lg border border-line px-3 py-2">Previous</Link>}
                {page * PAGE < total && <Link href={qs({ page: String(page + 1) })} className="rounded-lg border border-line px-3 py-2">Next</Link>}
              </span>
            </nav>
          )}
        </div>
        {can(ctx.role, 'crm.write') && (
          <aside className="card h-fit p-6"><h2 className="font-semibold">Add lead manually</h2>
            <div className="mt-4"><ActionForm action={createManualLead} resetOnSuccess>
              <TextInput name="full_name" label="Name" required maxLength={120} /><TextInput name="email" label="Email" type="email" required />
              <TextInput name="phone" label="Phone" maxLength={40} /><TextInput name="company" label="Company" maxLength={160} />
              <TextArea name="need_description" label="Need" rows={3} maxLength={5000} />
              <Checkbox name="privacy_consent" label="Contact agreed to be recorded (privacy policy)" />
              <SubmitButton>Add lead</SubmitButton>
            </ActionForm></div>
          </aside>
        )}
      </div>
    </>
  );
}
