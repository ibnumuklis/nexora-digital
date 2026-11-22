import { describe, expect, it } from 'vitest';
import { checkHealth, hostAllowed, isPrivateAddress, parseSafeUrl, resolveSafeUrl } from '@/lib/security/ssrf';
import { sniffMime } from '@/lib/security/files';
import { checkPassword, PASSWORD_MIN_LENGTH } from '@/lib/auth/password';
import { rateLimit, _resetRateLimits } from '@/lib/http/rate-limit';
import { buildCsp } from '@/middleware';

describe('SSRF guard', () => {
  it.each(['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1', '224.0.0.1'])('blocks private/special address %s', (ip) => {
    expect(isPrivateAddress(ip)).toBe(true);
  });
  it.each(['93.184.216.34', '8.8.8.8', '2606:4700:4700::1111'])('allows public address %s', (ip) => {
    expect(isPrivateAddress(ip)).toBe(false);
  });
  it('enforces https, allowlist, no credentials, no IP literals, no odd ports', () => {
    const allow = ['example.com'];
    expect(parseSafeUrl('http://example.com', allow)).toMatchObject({ ok: false, reason: 'https_required' });
    expect(parseSafeUrl('https://evil.com', allow)).toMatchObject({ ok: false, reason: 'host_not_allowlisted' });
    expect(parseSafeUrl('https://example.com.evil.com', allow)).toMatchObject({ ok: false, reason: 'host_not_allowlisted' });
    expect(parseSafeUrl('https://user:pw@example.com', allow)).toMatchObject({ ok: false, reason: 'credentials_in_url' });
    expect(parseSafeUrl('https://127.0.0.1', ['127.0.0.1'])).toMatchObject({ ok: false, reason: 'ip_literal_not_allowed' });
    expect(parseSafeUrl('https://example.com:22', allow)).toMatchObject({ ok: false, reason: 'port_not_allowed' });
    expect(parseSafeUrl('https://example.com', [])).toMatchObject({ ok: false, reason: 'allowlist_empty' });
    expect(parseSafeUrl('https://app.example.com/health', allow).ok).toBe(true);
    expect(hostAllowed('APP.Example.com.', allow)).toBe(true);
  });
  it('blocks allowlisted hosts that resolve to private addresses (DNS rebinding)', async () => {
    const r = await resolveSafeUrl('https://app.example.com', ['example.com'], async () => [{ address: '93.184.216.34' }, { address: '10.0.0.5' }]);
    expect(r).toMatchObject({ ok: false, reason: 'resolves_to_private_address' });
  });
  const resolver = async () => [{ address: '93.184.216.34' }];
  it('reports healthy only after a real 2xx/3xx response and never follows redirects', async () => {
    const calls: RequestInit[] = [];
    const fetchImpl = (async (_u: string, init: RequestInit) => { calls.push(init); return new Response(null, { status: 204 }); }) as unknown as typeof fetch;
    const r = await checkHealth('https://app.example.com/health', ['example.com'], { fetchImpl, resolver });
    expect(r.result).toBe('healthy');
    expect(r.httpStatus).toBe(204);
    expect(calls[0].redirect).toBe('manual');
    expect(calls[0].method).toBe('HEAD');
  });
  it('falls back to GET on 405 and maps 5xx to offline, 4xx to degraded', async () => {
    const seq = [405, 503];
    const f = (async () => new Response(null, { status: seq.shift()! })) as unknown as typeof fetch;
    expect((await checkHealth('https://a.example.com', ['example.com'], { fetchImpl: f, resolver })).result).toBe('offline');
    const f4 = (async () => new Response(null, { status: 404 })) as unknown as typeof fetch;
    expect((await checkHealth('https://a.example.com', ['example.com'], { fetchImpl: f4, resolver })).result).toBe('degraded');
  });
  it('times out', async () => {
    const f = ((_u: string, init: RequestInit) => new Promise((_, rej) => init.signal?.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' }))))) as unknown as typeof fetch;
    const r = await checkHealth('https://a.example.com', ['example.com'], { fetchImpl: f, resolver, timeoutMs: 50 });
    expect(r).toMatchObject({ result: 'offline', error: 'timeout' });
  });
  it('never contacts blocked targets', async () => {
    let called = false;
    const f = (async () => { called = true; return new Response(null); }) as unknown as typeof fetch;
    const r = await checkHealth('https://internal.example.com', ['example.com'], { fetchImpl: f, resolver: async () => [{ address: '127.0.0.1' }] });
    expect(r.result).toBe('blocked');
    expect(called).toBe(false);
  });
});

describe('upload sniffing', () => {
  it('detects real types by magic bytes', () => {
    expect(sniffMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png');
    expect(sniffMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(sniffMime(new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp');
    expect(sniffMime(new TextEncoder().encode('\0\0\0\x18ftypmp42'))).toBe('video/mp4');
    expect(sniffMime(new TextEncoder().encode('<svg onload=alert(1)>'))).toBeNull();
    expect(sniffMime(new TextEncoder().encode('GIF89a'))).toBeNull();
  });
});

describe('password policy (min 12 chars)', () => {
  it('rejects short, common, low-variety and email-derived passwords', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(12);
    expect(checkPassword('Abc123!x').ok).toBe(false);
    expect(checkPassword('password1234').ok).toBe(false);
    expect(checkPassword('alllowercaseletters').ok).toBe(false);
    expect(checkPassword('Aaaaa1111!!!x').ok).toBe(false);
    expect(checkPassword('Ibnumuklis#2026x', { email: 'ibnumuklis@example.com' }).ok).toBe(false);
    expect(checkPassword('x'.repeat(73) + 'A1!').ok).toBe(false);
  });
  it('accepts a strong passphrase', () => {
    const r = checkPassword('Teal-Harbor-29-Mango', { email: 'staff@nexora.test' });
    expect(r.ok).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(3);
  });
});

describe('rate limiter', () => {
  it('allows up to the limit within the window then blocks', () => {
    _resetRateLimits();
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) expect(rateLimit('k', 3, 1000, t + i).allowed).toBe(true);
    const blocked = rateLimit('k', 3, 1000, t + 10);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(rateLimit('k', 3, 1000, t + 2000).allowed).toBe(true);
  });
});

describe('CSP', () => {
  it('uses nonce + strict-dynamic, forbids framing and objects', () => {
    const csp = buildCsp('abc', 'https://ijkazeukjooauwsvwtiq.supabase.co', false);
    expect(csp).toContain(`script-src 'self' 'nonce-abc' 'strict-dynamic'`);
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).toContain(`frame-ancestors 'none'`);
    expect(csp).toContain(`object-src 'none'`);
    expect(csp).toContain('connect-src \'self\' https://ijkazeukjooauwsvwtiq.supabase.co wss://ijkazeukjooauwsvwtiq.supabase.co');
  });
});
