import { createSupabaseServerClient } from './server';

export async function requireStaff(roles: string[] = ['super_admin', 'admin']) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: null };
  const { data, error } = await supabase
    .from('staff_members')
    .select('role,is_active')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error || !data || !data.is_active || !roles.includes(data.role)) {
    return { supabase, user, role: null };
  }
  return { supabase, user, role: data.role };
}
