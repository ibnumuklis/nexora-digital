'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkPassword } from '@/lib/auth/password';
import { clientIp } from '@/lib/http/request';
import { rateLimit } from '@/lib/http/rate-limit';
import { siteUrl } from '@/lib/env';

export type AuthState = { error?: string; fieldErrors?: Record<string, string>; ok?: string };

const email = z.string().trim().toLowerCase().email('Enter a valid email address.').max(254);

/** Only allow same-site relative redirects (prevents open redirect). */
export async function safeNext(raw: unknown, fallback = '/admin'): Promise<string> {
  const v = typeof raw === 'string' ? raw : '';
  return /^\/(?!\/)[A-Za-z0-9/_\-?=&.%]*$/.test(v) && !v.startsWith('/auth/callback') ? v : fallback;
}

async function limited(kind: string, max: number): Promise<boolean> {
  const ip = clientIp(await headers());
  return !rateLimit(`auth:${kind}:${ip}`, max, 15 * 60_000).allowed;
}

/** Generic auth error messages avoid account enumeration. */
function authMessage(code?: string, message?: string): string {
  if (code === 'email_not_confirmed' || /not confirmed/i.test(message ?? '')) return 'Please confirm your email address first. Check your inbox for the confirmation link.';
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || /rate limit/i.test(message ?? '')) return 'Too many attempts. Please wait a few minutes and try again.';
  return 'Email or password is incorrect.';
}

export async function signInWithPassword(_: AuthState, fd: FormData): Promise<AuthState> {
  if (await limited('login', 10)) return { error: 'Too many sign-in attempts. Please wait 15 minutes.' };
  const parsed = z.object({ email, password: z.string().min(1, 'Enter your password.').max(72) }).safeParse({ email: fd.get('email'), password: fd.get('password') });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: authMessage(error.code, error.message) };
  redirect(await safeNext(fd.get('next')));
}

export async function signInWithMagicLink(_: AuthState, fd: FormData): Promise<AuthState> {
  if (await limited('magic', 5)) return { error: 'Too many requests. Please wait 15 minutes.' };
  const parsed = email.safeParse(fd.get('email'));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const next = await safeNext(fd.get('next'));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({ email: parsed.data, options: { shouldCreateUser: false, emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` } });
  if (error && /rate limit/i.test(error.message)) return { error: authMessage('over_email_send_rate_limit') };
  // Same response whether or not the account exists (no enumeration).
  return { ok: 'If an account exists for this email, a sign-in link is on its way. It expires in one hour.' };
}

export async function signUp(_: AuthState, fd: FormData): Promise<AuthState> {
  if (await limited('signup', 5)) return { error: 'Too many requests. Please wait 15 minutes.' };
  const parsed = z.object({ email, password: z.string(), confirm: z.string() }).safeParse({ email: fd.get('email'), password: fd.get('password'), confirm: fd.get('confirm') });
  if (!parsed.success) return { fieldErrors: { email: parsed.error.issues[0].message } };
  const pw = checkPassword(parsed.data.password, { email: parsed.data.email });
  if (!pw.ok) return { fieldErrors: { password: pw.errors.join(' ') } };
  if (parsed.data.password !== parsed.data.confirm) return { fieldErrors: { confirm: 'Passwords do not match.' } };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=/auth/confirmed` } });
  if (error) {
    if (/password/i.test(error.message)) return { fieldErrors: { password: 'This password was rejected by the authentication service. Choose a stronger one.' } };
    if (/rate limit/i.test(error.message)) return { error: authMessage('over_email_send_rate_limit') };
    if (/not authorized|invalid/i.test(error.message)) return { error: 'Confirmation emails cannot be delivered to this address yet. Contact the NEXORA administrator.' };
    return { error: 'Sign-up is temporarily unavailable. Please try again later.' };
  }
  return { ok: 'Check your inbox to confirm your email. After confirmation, a NEXORA Super Admin must assign your role before you can open the admin console.' };
}

export async function requestPasswordReset(_: AuthState, fd: FormData): Promise<AuthState> {
  if (await limited('reset', 5)) return { error: 'Too many requests. Please wait 15 minutes.' };
  const parsed = email.safeParse(fd.get('email'));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${siteUrl()}/auth/callback?next=/auth/reset-password` });
  if (error && /rate limit/i.test(error.message)) return { error: authMessage('over_email_send_rate_limit') };
  return { ok: 'If an account exists for this email, a password reset link has been sent. It expires in one hour.' };
}

export async function updatePassword(_: AuthState, fd: FormData): Promise<AuthState> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Your reset link has expired. Request a new one.' };
  const password = String(fd.get('password') ?? '');
  const pw = checkPassword(password, { email: user.email });
  if (!pw.ok) return { fieldErrors: { password: pw.errors.join(' ') } };
  if (password !== String(fd.get('confirm') ?? '')) return { fieldErrors: { confirm: 'Passwords do not match.' } };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (/different from the old/i.test(error.message)) return { fieldErrors: { password: 'Choose a password different from your current one.' } };
    if (/reauthentication/i.test(error.message)) return { error: 'For security, sign in again before changing your password.' };
    return { error: 'Could not update the password. Request a new reset link and try again.' };
  }
  // Revoke other sessions after a password change.
  await supabase.auth.signOut({ scope: 'others' });
  return { ok: 'Password updated. Other sessions have been signed out.' };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: 'local' });
  redirect('/auth/login?signed_out=1');
}

export async function signOutEverywhere() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: 'global' });
  redirect('/auth/login?signed_out=1');
}
