import 'server-only';
import { cookies } from 'next/headers';
import { createSupabasePublicClient } from '@/lib/supabase/server';

export const DEMO_COOKIE = 'nx_demo';

export const DEMO_ERRORS: Record<string, { status: number; code: DemoErrorCode; message: string }> = {
  invalid_input: { status: 400, code: 'unavailable', message: 'This demo link is not valid.' },
  demo_unavailable: { status: 404, code: 'unavailable', message: 'A live demo is not available for this product right now.' },
  rate_limited: { status: 429, code: 'rate_limited', message: 'You have started several demos recently. Please wait a while before trying again.' },
  active_session_exists: { status: 409, code: 'active_session', message: 'You already have an active demo session. End it or let it expire first.' },
  capacity_reached: { status: 503, code: 'capacity', message: 'All demo slots are in use. Please try again in a few minutes.' },
};
export type DemoErrorCode = 'unavailable' | 'rate_limited' | 'active_session' | 'capacity' | 'expired' | 'invalid' | 'network' | 'not_configured';

export type DemoSessionPayload = {
  session_id: string; token: string; session_ref: string; product_slug: string; product_name: string;
  started_at: string; expires_at: string; server_now: string; duration_seconds: number; idle_timeout_seconds: number;
  warning_seconds: number[]; watermark: string; mode: 'sandbox' | 'iframe'; iframe_url: string | null; disclaimer: string; allowed_modules: string[];
};

export type HeartbeatPayload =
  | { status: 'active'; server_now: string; expires_at: string; remaining_seconds: number; idle_remaining_seconds: number; product_id: string }
  | { status: 'expired' | 'ended' | 'revoked' | 'invalid'; reason?: string | null; server_now: string };

export function encodeDemoCookie(sessionId: string, token: string) {
  return `${sessionId}.${token}`;
}

export function decodeDemoCookie(value: string | undefined): { sessionId: string; token: string } | null {
  if (!value) return null;
  const m = /^([0-9a-f-]{36})\.([a-f0-9]{64})$/.exec(value);
  return m ? { sessionId: m[1], token: m[2] } : null;
}

export async function readDemoCookie() {
  return decodeDemoCookie((await cookies()).get(DEMO_COOKIE)?.value);
}

export async function setDemoCookie(sessionId: string, token: string, maxAgeSeconds: number) {
  (await cookies()).set(DEMO_COOKIE, encodeDemoCookie(sessionId, token), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: maxAgeSeconds + 30,
  });
}

export async function clearDemoCookie() {
  (await cookies()).delete(DEMO_COOKIE);
}

/** Validate the session on the server (DB time authoritative). `activity=true` resets the idle timer. */
export async function demoHeartbeat(sessionId: string, token: string, activity: boolean): Promise<HeartbeatPayload> {
  const { data, error } = await createSupabasePublicClient().rpc('demo_heartbeat', { p_session_id: sessionId, p_token: token, p_activity: activity });
  if (error || !data) throw new Error('heartbeat_failed');
  return data as unknown as HeartbeatPayload;
}
