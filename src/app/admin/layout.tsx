import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/shell';
import { getStaffContext, isStaff } from '@/lib/auth/session';
import { ADMIN_NAV, can, ROLE_LABELS } from '@/lib/auth/rbac';
import { publicEnv } from '@/lib/env';

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · NEXORA Admin' }, robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!publicEnv()) redirect('/auth/login');
  const ctx = await getStaffContext();
  if (!isStaff(ctx)) redirect(ctx.reason === 'anonymous' ? '/auth/login?next=/admin' : '/auth/no-access');
  const nav = ADMIN_NAV.filter((n) => can(ctx.role, n.permission)).map(({ label, href, icon }) => ({ label, href, icon }));
  return <AdminShell nav={nav} email={ctx.email ?? ''} roleLabel={ROLE_LABELS[ctx.role]}>{children}</AdminShell>;
}
