import 'server-only';
import { createHash } from 'node:crypto';
import { serverEnv } from '@/lib/env';

/** Best-effort client IP behind a reverse proxy (Vercel/most hosts set x-forwarded-for). */
export function clientIp(headers: Headers): string {
  return headers.get('x-real-ip')?.trim() || headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

/**
 * Pseudonymous visitor key: salted SHA-256 of IP + user agent. The raw IP is never stored.
 * Returns null in production when VISITOR_HASH_SALT is not configured (callers must fail closed).
 */
export function visitorHash(headers: Headers): string | null {
  const salt = serverEnv().visitorHashSalt;
  if (!salt) return null;
  const ua = (headers.get('user-agent') || 'unknown').slice(0, 300);
  return createHash('sha256').update(`${salt}|${clientIp(headers)}|${ua}`).digest('hex');
}

/** Same-origin check for state-changing JSON endpoints (CSRF defence in addition to SameSite cookies). */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return request.headers.get('sec-fetch-site') !== 'cross-site';
  try {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function readJson(request: Request, maxBytes = 16_384): Promise<unknown> {
  const text = await request.text();
  if (text.length > maxBytes) throw new Error('payload_too_large');
  return text ? JSON.parse(text) : {};
}
