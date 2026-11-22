import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * SSRF guard for server-side integration health checks (ADR-005).
 * - https only, default port or 443/8443
 * - host must be in the explicit allowlist (exact match or subdomain of an allowlisted apex)
 * - every resolved address must be public (no loopback/private/link-local/CGNAT/metadata/ULA)
 * - no credentials in URL
 */
export type UrlCheck = { ok: true; url: URL; addresses: string[] } | { ok: false; reason: string };

export function isPrivateAddress(address: string): boolean {
  const v = isIP(address);
  if (v === 4) {
    const [a, b] = address.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) || a >= 224
    );
  }
  if (v === 6) {
    const s = address.toLowerCase();
    if (s === '::' || s === '::1') return true;
    if (s.startsWith('::ffff:')) return isPrivateAddress(s.slice(7));
    return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(s) || s.startsWith('64:ff9b') || s.startsWith('2001:db8');
  }
  return true; // not an IP → treat as unsafe
}

export function hostAllowed(host: string, allowlist: string[]): boolean {
  const h = host.toLowerCase().replace(/\.$/, '');
  return allowlist.some((a) => h === a || h.endsWith('.' + a));
}

export function parseSafeUrl(raw: string, allowlist: string[]): UrlCheck {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: 'invalid_url' };
  }
  if (url.protocol !== 'https:') return { ok: false, reason: 'https_required' };
  if (url.username || url.password) return { ok: false, reason: 'credentials_in_url' };
  if (url.port && !['443', '8443'].includes(url.port)) return { ok: false, reason: 'port_not_allowed' };
  if (isIP(url.hostname.replace(/^\[|\]$/g, ''))) return { ok: false, reason: 'ip_literal_not_allowed' };
  if (!allowlist.length) return { ok: false, reason: 'allowlist_empty' };
  if (!hostAllowed(url.hostname, allowlist)) return { ok: false, reason: 'host_not_allowlisted' };
  return { ok: true, url, addresses: [] };
}

export async function resolveSafeUrl(
  raw: string,
  allowlist: string[],
  resolver: (host: string) => Promise<{ address: string }[]> = (h) => lookup(h, { all: true, verbatim: true }),
): Promise<UrlCheck> {
  const parsed = parseSafeUrl(raw, allowlist);
  if (!parsed.ok) return parsed;
  let addrs: { address: string }[];
  try {
    addrs = await resolver(parsed.url.hostname);
  } catch {
    return { ok: false, reason: 'dns_failed' };
  }
  if (!addrs.length) return { ok: false, reason: 'dns_failed' };
  if (addrs.some((a) => isPrivateAddress(a.address))) return { ok: false, reason: 'resolves_to_private_address' };
  return { ok: true, url: parsed.url, addresses: addrs.map((a) => a.address) };
}

export type HealthResult = { result: 'healthy' | 'degraded' | 'offline' | 'blocked'; httpStatus: number | null; latencyMs: number | null; error: string | null };

/** Perform one bounded HEAD (fallback GET) request; never follows redirects. */
export async function checkHealth(raw: string, allowlist: string[], opts: { timeoutMs?: number; fetchImpl?: typeof fetch; resolver?: Parameters<typeof resolveSafeUrl>[2] } = {}): Promise<HealthResult> {
  const safe = await resolveSafeUrl(raw, allowlist, opts.resolver);
  if (!safe.ok) return { result: 'blocked', httpStatus: null, latencyMs: null, error: safe.reason };
  const f = opts.fetchImpl ?? fetch;
  const started = Date.now();
  const attempt = async (method: 'HEAD' | 'GET') => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 5000);
    try {
      const res = await f(safe.url.toString(), { method, redirect: 'manual', signal: ctrl.signal, headers: { 'user-agent': 'NEXORA-HealthCheck/1.0' }, cache: 'no-store' });
      if (method === 'GET') await res.body?.cancel().catch(() => undefined);
      return res.status;
    } finally {
      clearTimeout(timer);
    }
  };
  try {
    let status = await attempt('HEAD');
    if (status === 405 || status === 501) status = await attempt('GET');
    const latencyMs = Date.now() - started;
    if (status >= 200 && status < 400) return { result: latencyMs > 2500 ? 'degraded' : 'healthy', httpStatus: status, latencyMs, error: null };
    return { result: status >= 500 ? 'offline' : 'degraded', httpStatus: status, latencyMs, error: `http_${status}` };
  } catch (e) {
    return { result: 'offline', httpStatus: null, latencyMs: Date.now() - started, error: (e as Error).name === 'AbortError' ? 'timeout' : 'network_error' };
  }
}
