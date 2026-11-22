import { requirePagePermission } from '@/lib/auth/session';
import { ROLE_LABELS } from '@/lib/auth/rbac';
import { PageHeader } from '@/components/ui';
import { ResetPasswordForm } from '@/components/auth/forms';
import { signOutEverywhere } from '@/app/auth/actions';
import { Button } from '@/components/ui';

export const metadata = { title: 'My account' };

export default async function AccountPage() {
  const ctx = await requirePagePermission('catalog.read');
  return (
    <>
      <PageHeader eyebrow={ROLE_LABELS[ctx.role]} title="My account" description={ctx.email ?? ''} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6"><ResetPasswordForm email={ctx.email ?? ''} /></section>
        <section className="card h-fit p-6">
          <h2 className="font-semibold">Sessions</h2>
          <p className="mt-2 text-sm text-muted">Sign out of NEXORA on every device (revokes all refresh tokens for your account).</p>
          <form action={signOutEverywhere} className="mt-4"><Button type="submit" variant="outline">Sign out everywhere</Button></form>
        </section>
      </div>
    </>
  );
}
