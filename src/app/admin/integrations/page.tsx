import { Activity } from 'lucide-react';
import { requirePagePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { serverEnv } from '@/lib/env';
import { PageHeader, Badge, EmptyState, Alert } from '@/components/ui';
import { DataTable, Td, fmtDate } from '@/components/admin/table';
import { ActionForm, Checkbox, SelectInput, SubmitButton, TextInput } from '@/components/admin/form';
import { deleteIntegration, runHealthCheck, saveIntegration } from './actions';

export const metadata = { title: 'Integrations' };
const TYPES = [{ value: 'direct_url', label: 'Direct URL' }, { value: 'iframe', label: 'Approved iframe' }, { value: 'api', label: 'API adapter' }, { value: 'sso', label: 'SSO (phased)' }];

export default async function IntegrationsPage() {
  const ctx = await requirePagePermission('catalog.read');
  const db = ctx.supabase;
  const [{ data: integrations }, { data: products }, { data: logs }] = await Promise.all([
    db.from('product_integrations').select('*,product:products(name)').order('created_at', { ascending: false }),
    db.from('products').select('id,name').order('name'),
    db.from('integration_check_logs').select('id,integration_id,checked_at,result,http_status,latency_ms,error').order('checked_at', { ascending: false }).limit(30),
  ]);
  const m = can(ctx.role, 'integrations.manage');
  const allow = serverEnv().integrationAllowedHosts;

  return (
    <>
      <PageHeader eyebrow="Integration center" title="Product integrations" description="Each product stays independently deployed. NEXORA stores links and runs bounded, allowlisted health checks — status is shown only after a real check." />
      <Alert tone={allow.length ? 'info' : 'warning'} className="mb-6" title="SSRF protection">
        {allow.length ? <>Allowed hosts: <code>{allow.join(', ')}</code>. Checks use HTTPS only, block private/loopback addresses, never follow redirects and time out after 5 s.</> : <>INTEGRATION_ALLOWED_HOSTS is empty, so every health check is blocked. Add verified product domains to the server environment.</>}
      </Alert>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="grid gap-6">
          {integrations?.length ? (
            <DataTable caption="Integrations" head={['Integration', 'Type', 'Health', 'Last check', '']}>
              {integrations.map((i) => (
                <tr key={i.id}>
                  <Td><p className="font-semibold">{i.display_name ?? (i.product as { name: string } | null)?.name}</p><p className="break-all font-mono text-[11px] text-muted">{i.application_url}{i.check_path !== '/' ? i.check_path : ''}</p>{!i.is_enabled && <Badge className="mt-1">disabled</Badge>}</Td>
                  <Td className="text-xs">{TYPES.find((t) => t.value === i.integration_type)?.label}</Td>
                  <Td><Badge tone={i.health_status === 'healthy' ? 'green' : i.health_status === 'degraded' ? 'amber' : i.health_status === 'offline' ? 'red' : 'neutral'}>{i.health_status === 'unknown' ? 'not verified' : i.health_status}</Badge>{i.last_status_code && <p className="text-[11px] text-muted">HTTP {i.last_status_code} · {i.last_latency_ms} ms</p>}{i.last_error && <p className="text-[11px] text-red-600">{i.last_error}</p>}</Td>
                  <Td className="text-xs text-muted">{fmtDate(i.last_checked_at, true)}</Td>
                  <Td>{m && <div className="flex flex-col gap-1">
                    <ActionForm action={runHealthCheck} className=""><input type="hidden" name="id" value={i.id} /><SubmitButton variant="outline" className="min-h-[34px] text-xs">Check now</SubmitButton></ActionForm>
                    <ActionForm action={deleteIntegration} className="" confirm="Remove this integration?"><input type="hidden" name="id" value={i.id} /><SubmitButton variant="ghost" className="min-h-[30px] text-xs text-red-600">Remove</SubmitButton></ActionForm>
                  </div>}</Td>
                </tr>
              ))}
            </DataTable>
          ) : <EmptyState icon={<Activity />} title="No integrations registered">Register verified product URLs once the owner supplies them.</EmptyState>}
          {logs?.length ? (
            <section><h2 className="mb-3 font-semibold">Check log</h2>
              <DataTable caption="Health check log" head={['Time', 'Integration', 'Result', 'HTTP', 'Latency', 'Error']}>
                {logs.map((l) => <tr key={l.id}><Td className="text-xs">{fmtDate(l.checked_at, true)}</Td><Td className="text-xs">{integrations?.find((i) => i.id === l.integration_id)?.display_name ?? '—'}</Td><Td><Badge tone={l.result === 'healthy' ? 'green' : l.result === 'blocked' ? 'amber' : l.result === 'offline' ? 'red' : 'neutral'}>{l.result}</Badge></Td><Td>{l.http_status ?? '—'}</Td><Td>{l.latency_ms ?? '—'}</Td><Td className="text-xs">{l.error ?? ''}</Td></tr>)}
              </DataTable>
            </section>
          ) : null}
        </div>
        {m && (
          <aside className="card h-fit p-6"><h2 className="font-semibold">Register integration</h2>
            <div className="mt-4"><ActionForm action={saveIntegration} resetOnSuccess>
              <SelectInput name="product_id" label="Product" required options={(products ?? []).map((p) => ({ value: p.id, label: p.name }))} />
              <TextInput name="display_name" label="Name" required maxLength={80} />
              <SelectInput name="integration_type" label="Mode" options={TYPES} />
              <TextInput name="application_url" label="Base URL" type="url" required placeholder="https://app.example.com" />
              <TextInput name="check_path" label="Health path" defaultValue="/" maxLength={200} />
              <Checkbox name="is_enabled" label="Enabled" />
              <SubmitButton>Save</SubmitButton>
            </ActionForm></div>
          </aside>
        )}
      </div>
    </>
  );
}
