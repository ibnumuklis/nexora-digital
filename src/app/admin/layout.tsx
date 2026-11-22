import { AdminShell } from '@/components/admin-shell';
import { AdminLogin,AdminAccessDenied,AdminSetupRequired } from '@/components/admin-gate';
import { createSupabaseServerClient } from '@/lib/supabase/server';
export const dynamic='force-dynamic';
export default async function AdminLayout({children}:{children:React.ReactNode}){
 if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)return <AdminSetupRequired/>;
 try{const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return <AdminLogin/>;const {data:role}=await supabase.from('staff_members').select('role,is_active').eq('user_id',user.id).maybeSingle();if(!role || !role.is_active)return <AdminAccessDenied/>;return <AdminShell>{children}</AdminShell>;}catch{return <AdminSetupRequired/>;}
}
