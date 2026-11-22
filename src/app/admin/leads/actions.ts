'use server';
import { z } from 'zod';
import { formToObject, must, runAction, type ActionResult } from '@/lib/admin/action';
import { ACTIVITY_TYPES, LEAD_STAGES } from '@/lib/crm';

const uuid = z.string().uuid();
const optUuid = z.string().uuid().optional().or(z.literal('')).transform((v) => v || null);
const optDate = z.string().optional().transform((v) => (v ? new Date(v).toISOString() : null)).refine((v) => v === null || !Number.isNaN(Date.parse(v)), 'Invalid date.');

export async function updateLead(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({ id: uuid, status: z.enum(LEAD_STAGES), owner_id: optUuid, next_follow_up_at: optDate, lost_reason: z.string().trim().max(300).optional().transform((v) => v || null) });
  return runAction('crm.write', schema, formToObject(fd), async (ctx, { id, ...d }) => {
    if (d.status === 'lost' && !d.lost_reason) return { fieldErrors: { lost_reason: 'Record why the lead was lost.' }, error: 'A reason is required for lost leads.' };
    must(await ctx.supabase.from('leads').update(d).eq('id', id).select('id').single());
    return { ok: true, message: 'Lead updated.' };
  }, ['/admin/leads']);
}

export async function addActivity(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({ lead_id: uuid, activity_type: z.enum(ACTIVITY_TYPES), notes: z.string().trim().min(2, 'Add a short note.').max(5000), due_at: optDate });
  return runAction('crm.write', schema, formToObject(fd), async (ctx, d) => {
    must(await ctx.supabase.from('lead_activities').insert({ ...d, created_by: ctx.userId }).select('id').single());
    const patch: { last_contacted_at?: string; next_follow_up_at?: string } = {};
    if (['call', 'meeting', 'email_logged', 'whatsapp_logged'].includes(d.activity_type)) patch.last_contacted_at = new Date().toISOString();
    if (d.activity_type === 'follow_up' && d.due_at) patch.next_follow_up_at = d.due_at;
    if (Object.keys(patch).length) must(await ctx.supabase.from('leads').update(patch).eq('id', d.lead_id).select('id').single());
    return { ok: true, message: 'Activity recorded.' };
  }, ['/admin/leads']);
}

export async function createManualLead(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({
    full_name: z.string().trim().min(2).max(120), email: z.string().trim().toLowerCase().email().max(254),
    phone: z.string().trim().max(40).optional().transform((v) => v || null), company: z.string().trim().max(160).optional().transform((v) => v || null),
    need_description: z.string().trim().max(5000).optional().transform((v) => v || null),
    privacy_consent: z.preprocess((v) => v === 'on', z.literal(true, { message: 'Confirm the contact agreed to be recorded.' })),
  });
  return runAction('crm.write', schema, formToObject(fd), async (ctx, d) => {
    must(await ctx.supabase.from('leads').insert({ ...d, source: 'manual', status: 'new', privacy_consented_at: new Date().toISOString(), owner_id: ctx.userId }).select('id').single());
    return { ok: true, message: 'Lead created.' };
  }, ['/admin/leads']);
}

export async function deleteLead(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return runAction('crm.delete', z.object({ id: uuid }), formToObject(fd), async (ctx, d) => {
    must(await ctx.supabase.from('leads').delete().eq('id', d.id).select('id'));
    await ctx.supabase.rpc('log_audit_event', { p_action: 'lead_erasure', p_entity_type: 'leads', p_entity_id: d.id, p_metadata: { reason: 'admin_delete' } });
    return { ok: true, message: 'Lead and its activities were permanently deleted.' };
  }, ['/admin/leads']);
}
