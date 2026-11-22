import type { Metadata } from 'next';
import Link from 'next/link';
import { ResetPasswordForm } from '@/components/auth/forms';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Alert } from '@/components/ui';

export const metadata: Metadata = { title: 'Choose a new password' };
export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div>
        <h1 className="text-3xl font-semibold">Reset link required</h1>
        <Alert tone="warning" className="mt-6">Open the password reset link from your email, or request a new one. Links expire after one hour and work once.</Alert>
        <Link href="/auth/forgot-password" className="mt-6 inline-block text-sm font-semibold text-accent">Request a new reset link</Link>
      </div>
    );
  }
  return <ResetPasswordForm email={user.email ?? ''} />;
}
