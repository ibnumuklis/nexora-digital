import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = { title: 'Email confirmed' };

export default function ConfirmedPage() {
  return (
    <div>
      <CheckCircle2 className="text-emerald-600 dark:text-lime" size={40} aria-hidden />
      <h1 className="mt-4 text-3xl font-semibold">Email confirmed</h1>
      <p className="mt-3 text-sm leading-6 text-muted">Your account is active. A NEXORA Super Admin must now assign your staff role before the admin console becomes available.</p>
      <Link href="/admin" className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-forest px-5 text-sm font-semibold text-white dark:bg-lime dark:text-forest">Continue</Link>
    </div>
  );
}
