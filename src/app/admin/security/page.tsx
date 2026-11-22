import Link from 'next/link';
import { requirePagePermission } from '@/lib/auth/session';
import { serverEnv } from '@/lib/env';
import { PageHeader, Badge, Alert } from '@/components/ui';
import { DataTable, Td, fmtDate } from '@/components/admin/table';
import { signOutEverywhere } from '@/app/auth/actions';
import { Button } from '@/components/ui';

export const metadata = { title: 'Security' };
const PAGE = 50;

export default async function SecurityPage({ searchParams }: { searchParams: Promise<{ entity?: string; action?: string; page?: string }> }) {
  const ctx = await requirePagePermission('audit.read');
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  let q = ctx.supabase.from('audit_logs').select('id,actor_id,action,entity_type,entity_id,metadata,created_at', { count: 'exact' }).order('created_at', { ascending: false });
  if (sp.entity && /^[a-z_]{3,40}$/.test(sp.entity)) q = q.eq('entity_type', sp.entity);
  if (sp.action && /^[a-z_]{3,40}$/.test(sp.action)) q = q.eq('action', sp.action);
  const [{ data: logs, count }, { data: staff }] = await Promise.all([q.range((page - 1) * PAGE, page * PAGE - 1), ctx.supabase.rpc('staff_directory')]);
  const who = (id: string | null) => (id ? staff?.find((s) => s.user_id === id)?.email ?? id.slice(0, 8) : 'system / public');
  const env = serverEnv();
  const checks = [
    { ok: !!process.env.VISITOR_HASH_SALT, label: 'VISITOR_HASH_SALT configured (demo & inquiry visitor keys)' },
    { ok: env.integrationAllowedHosts.length > 0, label: 'INTEGRATION_ALLOWED_HOSTS configured (health checks)' },
    { ok: !process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY, label: 'No service-role key exposed via NEXT_PUBLIC_*' },
    { ok: process.env.NODE_ENV === 'production', label: 'Running in production mode (HSTS, upgrade-insecure-requests)' },
  ];

  return (
    <>
      <PageHeader eyebrow="Security center" title="Audit log & posture" description="Every insert/update/delete on privileged tables is recorded with actor, entity and changed column names (values are not copied)."
        actions={<form action={signOutEverywhere}><Button type="submit" variant="outline">Sign out all my sessions</Button></form>} />
      <section className="card mb-6 p-6">
        <h2 className="font-semibold">Configuration checks</h2>
        <ul className="mt-3 grid gap-2 text-sm">{checks.map((c) => <li key={c.label} className="flex items-center gap-2"><Badge tone={c.ok ? 'green' : 'amber'}>{c.ok ? 'ok' : 'action'}</Badge>{c.label}</li>)}</ul>
        <Alert tone="info" className="mt-4" title="Supabase Free Plan limitations">Leaked-password (HIBP) checks, custom SMTP-based email volume, PITR backups and SSO are not available on the Free Plan. See <code>docs/SECURITY_FREE_PLAN_LIMITATIONS.md</code> for compensating controls.</Alert>
      </section>
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="entity" defaultValue={sp.entity} placeholder="entity (e.g. products)" aria-label="Entity" className="min-h-[44px] rounded-xl border border-line bg-surface px-3 text-sm" />
        <input name="action" defaultValue={sp.action} placeholder="action (insert, update, lead_export…)" aria-label="Action" className="min-h-[44px] rounded-xl border border-line bg-surface px-3 text-sm" />
        <button className="min-h-[44px] rounded-xl bg-forest px-4 text-sm font-semibold text-white dark:bg-lime dark:text-forest">Filter</button>
      </form>
      <DataTable caption="Audit log" head={['Time', 'Actor', 'Action', 'Entity', 'Details']}>
        {(logs ?? []).map((l) => (
          <tr key={l.id}>
            <Td className="whitespace-nowrap text-xs">{fmtDate(l.created_at, true)}</Td>
            <Td className="text-xs">{who(l.actor_id)}</Td>
            <Td><Badge>{l.action}</Badge></Td>
            <Td className="text-xs">{l.entity_type}{l.entity_id && <span className="font-mono text-muted"> · {l.entity_id.slice(0, 8)}</span>}</Td>
            <Td className="max-w-md break-words font-mono text-[11px] text-muted">{JSON.stringify(l.metadata)}</Td>
          </tr>
        ))}
      </DataTable>
      {(count ?? 0) > PAGE && <nav className="mt-4 flex gap-2 text-sm" aria-label="Pagination">{page > 1 && <Link href={`?page=${page - 1}`} className="rounded-lg border border-line px-3 py-2">Previous</Link>}{page * PAGE < (count ?? 0) && <Link href={`?page=${page + 1}`} className="rounded-lg border border-line px-3 py-2">Next</Link>}</nav>}
    </>
  );
}
