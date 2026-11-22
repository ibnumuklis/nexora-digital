import Link from 'next/link';
import { z } from 'zod';
import { ShieldCheck } from 'lucide-react';
import { requirePagePermission } from '@/lib/auth/session';
import { formToObject, runAction, type ActionResult } from '@/lib/admin/action';
import { PageHeader, Badge, EmptyState } from '@/components/ui';
import { DataTable, Td, fmtDate, StatCard } from '@/components/admin/table';
import { ActionForm, SubmitButton } from '@/components/admin/form';

export const metadata = { title: 'Demo sessions' };

async function revoke(_: ActionResult, fd: FormData): Promise<ActionResult> {
  'use server';
  return runAction('demo.manage', z.object({ id: z.string().uuid() }), formToObject(fd), async (ctx, d) => {
    const { data, error } = await ctx.supabase.rpc('demo_admin_revoke', { p_session_id: d.id });
    if (error) throw error;
    return data ? { ok: true, message: 'Session revoked.' } : { error: 'Session is no longer active.' };
  }, ['/admin/demo']);
}

async function cleanup(_: ActionResult): Promise<ActionResult> {
  'use server';
  return runAction('demo.manage', z.object({}), {}, async (ctx) => {
    const { data, error } = await ctx.supabase.rpc('demo_cleanup', { p_retention_days: 30 });
    if (error) throw error;
    const r = data as { expired: number; deleted: number };
    return { ok: true, message: `Cleanup done: ${r.expired} expired, ${r.deleted} old sessions deleted.` };
  }, ['/admin/demo']);
}

export default async function DemoAdmin() {
  const ctx = await requirePagePermission('demo.manage');
  const db = ctx.supabase;
  const [{ data: sessions }, { data: policies }, { data: events }] = await Promise.all([
    db.from('demo_sessions').select('id,status,started_at,last_seen_at,expires_at,ended_at,metadata,product:products(name)').order('started_at', { ascending: false }).limit(100),
    db.from('demo_policies').select('enabled,duration_minutes,idle_timeout_seconds,max_concurrent_sessions,mode,product:products(id,name,publication_status,demo_enabled)'),
    db.from('demo_session_events').select('event_type').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()).limit(5000),
  ]);
  const count = (t: string) => (events ?? []).filter((e) => e.event_type === t).length;
  const active = (sessions ?? []).filter((s) => s.status === 'active' && new Date(s.expires_at) > new Date());

  return (
    <>
      <PageHeader eyebrow="Demo engine" title="Demo sessions" description="Sessions are created and validated by database functions using server time. Tokens are stored only as SHA-256 hashes."
        actions={<ActionForm action={cleanup} className=""><SubmitButton variant="outline">Run cleanup</SubmitButton></ActionForm>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active now" value={active.length} />
        <StatCard label="Started (7d)" value={count('started')} />
        <StatCard label="Ended by user (7d)" value={count('ended')} />
        <StatCard label="Expired (7d)" value={count('expired')} />
        <StatCard label="Idle timeouts (7d)" value={count('idle_timeout')} />
      </div>
      <section className="mb-8">
        <h2 className="mb-3 font-semibold">Policies</h2>
        <DataTable caption="Demo policies" head={['Product', 'Demo', 'Duration', 'Idle', 'Capacity', 'Mode']}>
          {(policies ?? []).map((p, i) => {
            const pr = p.product as { id: string; name: string; publication_status: string; demo_enabled: boolean } | null;
            return (
              <tr key={i}>
                <Td><Link href={`/admin/products/${pr?.id}`} className="font-medium hover:text-accent">{pr?.name}</Link></Td>
                <Td>{p.enabled && pr?.demo_enabled ? <Badge tone="green">live</Badge> : p.enabled ? <Badge tone="amber">waiting for publish</Badge> : <Badge>off</Badge>}</Td>
                <Td>{p.duration_minutes} min</Td><Td>{p.idle_timeout_seconds}s</Td><Td>{p.max_concurrent_sessions}</Td><Td>{p.mode}</Td>
              </tr>
            );
          })}
        </DataTable>
      </section>
      <h2 className="mb-3 font-semibold">Recent sessions</h2>
      {sessions?.length ? (
        <DataTable caption="Demo sessions" head={['Ref', 'Product', 'Status', 'Started', 'Last activity', 'Expires', '']}>
          {sessions.map((s) => (
            <tr key={s.id}>
              <Td className="font-mono text-xs">{s.id.replace(/-/g, '').slice(0, 8).toUpperCase()}</Td>
              <Td>{(s.product as { name: string } | null)?.name}</Td>
              <Td><Badge tone={s.status === 'active' ? 'green' : s.status === 'revoked' ? 'red' : 'neutral'}>{s.status}</Badge>{(s.metadata as { end_reason?: string })?.end_reason && <span className="ml-1 text-xs text-muted">({(s.metadata as { end_reason?: string }).end_reason})</span>}</Td>
              <Td className="text-xs">{fmtDate(s.started_at, true)}</Td><Td className="text-xs">{fmtDate(s.last_seen_at, true)}</Td><Td className="text-xs">{fmtDate(s.expires_at, true)}</Td>
              <Td>{s.status === 'active' && <ActionForm action={revoke} className="" confirm="Revoke this session now?"><input type="hidden" name="id" value={s.id} /><SubmitButton variant="ghost" className="min-h-[32px] text-xs text-red-600">Revoke</SubmitButton></ActionForm>}</Td>
            </tr>
          ))}
        </DataTable>
      ) : <EmptyState icon={<ShieldCheck />} title="No demo sessions yet">Sessions appear here once a published product has its demo enabled.</EmptyState>}
    </>
  );
}
