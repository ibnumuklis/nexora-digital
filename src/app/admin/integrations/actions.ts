'use server';
import { z } from 'zod';
import { formToObject, must, runAction, type ActionResult } from '@/lib/admin/action';
import { checkHealth, parseSafeUrl } from '@/lib/security/ssrf';
import { serverEnv } from '@/lib/env';

export async function saveIntegration(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({
    id: z.string().uuid().optional().or(z.literal('')).transform((v) => v || undefined),
    product_id: z.string().uuid(),
    display_name: z.string().trim().min(2).max(80),
    integration_type: z.enum(['direct_url', 'iframe', 'api', 'sso']),
    application_url: z.string().trim().max(500).refine((v) => /^https:\/\/[a-z0-9.-]+(:[0-9]+)?(\/.*)?$/i.test(v), 'Must be an https:// URL.'),
    check_path: z.string().trim().max(200).regex(/^\/[A-Za-z0-9._~/-]*$/, 'Path must start with / and contain only safe characters.').default('/'),
    is_enabled: z.preprocess((v) => v === 'on', z.boolean()),
  });
  return runAction('integrations.manage', schema, formToObject(fd), async (ctx, { id, ...d }) => {
    const allow = serverEnv().integrationAllowedHosts;
    const parsed = parseSafeUrl(d.application_url, allow);
    const warn = !parsed.ok ? ` Note: health checks will be blocked (${parsed.reason.replace(/_/g, ' ')}) until the host is in INTEGRATION_ALLOWED_HOSTS.` : '';
    // Any URL change resets health: status is shown only after a real successful check.
    const u = new URL(d.application_url);
    const normalized = `https://${u.host.toLowerCase()}${u.pathname === '/' ? '' : u.pathname.replace(/\/$/, '')}`;
    const patch = { ...d, application_url: normalized, health_status: 'unknown', last_checked_at: null, last_status_code: null, last_latency_ms: null, last_error: null };
    if (id) must(await ctx.supabase.from('product_integrations').update(patch).eq('id', id).select('id').single());
    else must(await ctx.supabase.from('product_integrations').insert(patch).select('id').single());
    return { ok: true, message: 'Integration saved. Run a health check to verify it.' + warn };
  }, ['/admin/integrations']);
}

export async function runHealthCheck(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return runAction('integrations.manage', z.object({ id: z.string().uuid() }), formToObject(fd), async (ctx, d) => {
    const integ = must(await ctx.supabase.from('product_integrations').select('id,application_url,check_path').eq('id', d.id).single());
    if (!integ.application_url) return { error: 'No URL configured.' };
    const target = new URL(integ.check_path || '/', integ.application_url).toString();
    const res = await checkHealth(target, serverEnv().integrationAllowedHosts);
    must(await ctx.supabase.from('integration_check_logs').insert({ integration_id: d.id, result: res.result, http_status: res.httpStatus, latency_ms: res.latencyMs, error: res.error, checked_by: ctx.userId }).select('id').single());
    const health = res.result === 'blocked' ? 'unknown' : res.result;
    must(await ctx.supabase.from('product_integrations').update({
      health_status: health, last_checked_at: res.result === 'blocked' ? null : new Date().toISOString(),
      last_status_code: res.httpStatus, last_latency_ms: res.latencyMs, last_error: res.error,
    }).eq('id', d.id).select('id').single());
    if (res.result === 'blocked') return { error: `Check blocked by SSRF protection: ${res.error?.replace(/_/g, ' ')}.` };
    return { ok: true, message: `Result: ${res.result} (HTTP ${res.httpStatus ?? '—'}, ${res.latencyMs ?? '—'} ms).` };
  }, ['/admin/integrations']);
}

export async function deleteIntegration(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return runAction('integrations.manage', z.object({ id: z.string().uuid() }), formToObject(fd), async (ctx, d) => {
    must(await ctx.supabase.from('product_integrations').delete().eq('id', d.id).select('id'));
    return { ok: true, message: 'Integration removed.' };
  }, ['/admin/integrations']);
}
