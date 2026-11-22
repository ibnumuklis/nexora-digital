import 'server-only';
import type { StaffContext } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';

/** Owner choices: admins see the staff directory; others can only assign to themselves (RLS). */
export async function ownerOptions(ctx: StaffContext): Promise<{ value: string; label: string }[]> {
  if (can(ctx.role, 'staff.read')) {
    const { data } = await ctx.supabase.rpc('staff_directory');
    return (data ?? []).filter((s) => s.is_active && ['super_admin', 'admin', 'sales_manager'].includes(s.role)).map((s) => ({ value: s.user_id, label: s.email }));
  }
  return [{ value: ctx.userId, label: `${ctx.email ?? 'Me'} (me)` }];
}
