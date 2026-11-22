import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/** Content-Security-Policy with a per-request nonce (Next.js applies it to its own scripts). */
export function buildCsp(nonce: string, supabaseUrl: string | undefined, isDev: boolean): string {
  const supa = supabaseUrl ? new URL(supabaseUrl).origin : '';
  const supaWs = supa.replace(/^https/, 'wss');
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? ` 'unsafe-eval'` : ''}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: ${supa}`.trim(),
    `font-src 'self' data:`,
    `connect-src 'self' ${supa} ${supaWs}`.trim(),
    `media-src 'self' blob: ${supa}`.trim(),
    `frame-src 'self' https:`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

export async function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NODE_ENV !== 'production');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);

  const finalize = (res: NextResponse) => {
    res.headers.set('Content-Security-Policy', csp);
    return res;
  };
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const path = request.nextUrl.pathname;
  const needsAuth = path.startsWith('/admin') || path.startsWith('/auth') || path.startsWith('/api/admin');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!needsAuth || !url || !key) return finalize(response);

  // Refresh the Supabase session cookie (rotating refresh tokens) and gate /admin.
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();

  if (path.startsWith('/admin') && !user) {
    const login = request.nextUrl.clone();
    login.pathname = '/auth/login';
    login.search = `?next=${encodeURIComponent(path)}`;
    return finalize(NextResponse.redirect(login));
  }
  return finalize(response);
}

export const config = {
  matcher: [{ source: '/((?!_next/static|_next/image|favicon.ico|icon|robots.txt|sitemap.xml).*)', missing: [{ type: 'header', key: 'next-router-prefetch' }] }],
};
