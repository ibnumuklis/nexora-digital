import { z } from 'zod';
import { requirePagePermission } from '@/lib/auth/session';
import { can, ROLE_LABELS, STAFF_ROLES, isStaffRole } from '@/lib/auth/rbac';
import { formToObject, must, runAction, type ActionResult } from '@/lib/admin/action';
import { PageHeader, Badge, Alert } from '@/components/ui';
import { DataTable, Td, fmtDate } from '@/components/admin/table';
import { ActionForm, SelectInput, SubmitButton, TextInput } from '@/components/admin/form';

export const metadata = { title: 'Staff' };

async function grantRole(_: ActionResult, fd: FormData): Promise<ActionResult> {
  'use server';
  return runAction('staff.manage', z.object({ email: z.string().trim().toLowerCase().email(), role: z.enum(STAFF_ROLES) }), formToObject(fd), async (ctx, d) => {
    const { error } = await ctx.supabase.rpc('grant_staff_role', { p_email: d.email, p_role: d.role });
    if (error) return { error: error.message === 'user_not_found_or_unconfirmed' ? 'No confirmed account with that email. Ask the person to sign up and confirm their email first.' : 'Could not assign the role.' };
    return { ok: true, message: `${ROLE_LABELS[d.role]} role assigned to ${d.email}.` };
  }, ['/admin/staff']);
}

async function updateStaff(_: ActionResult, fd: FormData): Promise<ActionResult> {
  'use server';
  return runAction('staff.manage', z.object({ user_id: z.string().uuid(), role: z.enum(STAFF_ROLES), is_active: z.enum(['true', 'false']) }), formToObject(fd), async (ctx, d) => {
    if (d.user_id === ctx.userId && (d.is_active === 'false' || d.role !== 'super_admin')) return { error: 'You cannot demote or deactivate your own account.' };
    must(await ctx.supabase.from('staff_members').update({ role: d.role, is_active: d.is_active === 'true' }).eq('user_id', d.user_id).select('user_id').single());
    return { ok: true, message: 'Staff member updated.' };
  }, ['/admin/staff']);
}

export default async function StaffPage() {
  const ctx = await requirePagePermission('staff.read');
  const { data: staff, error } = await ctx.supabase.rpc('staff_directory');
  const manage = can(ctx.role, 'staff.manage');
  return (
    <>
      <PageHeader eyebrow="Access control" title="Staff & roles" description="Least privilege: assign the narrowest role that fits. Every change is written to the audit log." />
      {error && <Alert tone="error" className="mb-4">Could not load staff directory.</Alert>}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <DataTable caption="Staff members" head={['Email', 'Role', 'Status', 'Last sign-in', manage ? 'Change' : '']}>
          {(staff ?? []).map((s) => (
            <tr key={s.user_id}>
              <Td>{s.email}{s.user_id === ctx.userId && <Badge className="ml-2">you</Badge>}</Td>
              <Td>{isStaffRole(s.role) ? ROLE_LABELS[s.role] : s.role}</Td>
              <Td>{s.is_active ? <Badge tone="green">active</Badge> : <Badge tone="red">inactive</Badge>}</Td>
              <Td className="text-xs">{fmtDate(s.last_sign_in_at, true)}</Td>
              <Td>{manage && s.user_id !== ctx.userId && (
                <ActionForm action={updateStaff} className="flex flex-wrap items-end gap-2" confirm="Apply this access change?">
                  <input type="hidden" name="user_id" value={s.user_id} />
                  <select name="role" defaultValue={s.role} aria-label="Role" className="min-h-[36px] rounded-lg border border-line bg-surface px-2 text-xs">{STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select>
                  <select name="is_active" defaultValue={String(s.is_active)} aria-label="Status" className="min-h-[36px] rounded-lg border border-line bg-surface px-2 text-xs"><option value="true">Active</option><option value="false">Inactive</option></select>
                  <SubmitButton variant="outline" className="min-h-[36px] px-3 text-xs">Save</SubmitButton>
                </ActionForm>
              )}</Td>
            </tr>
          ))}
        </DataTable>
        {manage && (
          <aside className="card h-fit p-6"><h2 className="font-semibold">Grant access</h2>
            <p className="mt-1 text-xs text-muted">The person must first create an account at /auth/signup and confirm their email.</p>
            <div className="mt-4"><ActionForm action={grantRole} resetOnSuccess>
              <TextInput name="email" label="Account email" type="email" required />
              <SelectInput name="role" label="Role" defaultValue="content_editor" options={STAFF_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />
              <SubmitButton>Assign role</SubmitButton>
            </ActionForm></div>
          </aside>
        )}
      </div>
    </>
  );
}
