import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { can, isStaffRole, type Permission, type StaffRole } from './rbac';

export type StaffContext = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
  email: string | null;
  role: StaffRole;
};

/**
 * Resolve the signed-in user and active staff role. `auth.getUser()` re-validates the JWT with
 * Supabase Auth on every request (never trust `getSession()` on the server).
 */
export const getStaffContext = cache(async (): Promise<StaffContext | { reason: 'anonymous' | 'not_staff'; email?: string | null }> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { reason: 'anonymous' };
  const { data } = await supabase.from('staff_members').select('role,is_active').eq('user_id', user.id).maybeSingle();
  if (!data || !data.is_active || !isStaffRole(data.role)) return { reason: 'not_staff', email: user.email };
  return { supabase, userId: user.id, email: user.email ?? null, role: data.role };
});

export function isStaff(ctx: Awaited<ReturnType<typeof getStaffContext>>): ctx is StaffContext {
  return 'role' in ctx;
}

/** For admin pages: redirect anonymous users to login; render 403 for non-permitted roles. */
export async function requirePagePermission(permission: Permission): Promise<StaffContext> {
  const ctx = await getStaffContext();
  if (!isStaff(ctx)) redirect(ctx.reason === 'anonymous' ? '/auth/login?next=/admin' : '/auth/no-access');
  if (!can(ctx.role, permission)) redirect('/admin?denied=' + encodeURIComponent(permission));
  return ctx;
}

export class AuthzError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
  }
}

/** For server actions and route handlers. Throws AuthzError (401/403). */
export async function requirePermission(permission: Permission): Promise<StaffContext> {
  const ctx = await getStaffContext();
  if (!isStaff(ctx)) throw new AuthzError(ctx.reason === 'anonymous' ? 401 : 403, ctx.reason === 'anonymous' ? 'Unauthenticated' : 'Forbidden');
  if (!can(ctx.role, permission)) throw new AuthzError(403, 'Forbidden');
  return ctx;
}
