import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const OTP_TYPES: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'];

/**
 * Handles email confirmation, magic links and password recovery.
 * Supports both PKCE (`?code=`) and token-hash (`?token_hash=&type=`) email templates.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const rawNext = url.searchParams.get('next') ?? '/admin';
  const next = /^\/(?!\/)[A-Za-z0-9/_\-?=&.%]*$/.test(rawNext) ? rawNext : '/admin';
  const errorDesc = url.searchParams.get('error_description');
  const fail = (reason: string) => NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(reason)}`, url.origin));
  if (errorDesc) return fail(/expired/i.test(errorDesc) ? 'link_expired' : 'link_invalid');

  const supabase = await createSupabaseServerClient();
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail('link_invalid');
  } else if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return fail(/expired/i.test(error.message) ? 'link_expired' : 'link_invalid');
    if (type === 'recovery') return NextResponse.redirect(new URL('/auth/reset-password', url.origin));
    if (type === 'signup' || type === 'email') return NextResponse.redirect(new URL('/auth/confirmed', url.origin));
  } else {
    return fail('link_invalid');
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
