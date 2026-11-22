import type { Metadata } from 'next';
import { LockKeyhole } from 'lucide-react';
import { signOut } from '@/app/auth/actions';
import { Button } from '@/components/ui';

export const metadata: Metadata = { title: 'Access not authorised' };

export default function NoAccessPage() {
  return (
    <div>
      <LockKeyhole size={38} className="text-accent" aria-hidden />
      <h1 className="mt-5 text-3xl font-semibold">Access not authorised</h1>
      <p className="mt-3 text-sm leading-6 text-muted">You are signed in, but your account has no active NEXORA staff role. Ask a Super Admin to assign one in Admin → Staff.</p>
      <form action={signOut} className="mt-6"><Button type="submit" variant="outline">Sign out</Button></form>
    </div>
  );
}
