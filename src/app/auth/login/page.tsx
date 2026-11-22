import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/forms';
import { getStaffContext, isStaff } from '@/lib/auth/session';
import { safeNext } from '@/app/auth/actions';
import { publicEnv } from '@/lib/env';
import { Alert } from '@/components/ui';

export const metadata: Metadata = { title: 'Staff sign in' };
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; signed_out?: string }> }) {
  const sp = await searchParams;
  if (!publicEnv()) return <Alert tone="warning" title="Setup required">Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.</Alert>;
  const next = await safeNext(sp.next);
  const ctx = await getStaffContext();
  if (isStaff(ctx)) redirect(next);
  return <LoginForm next={next} error={sp.error} signedOut={sp.signed_out === '1'} />;
}
