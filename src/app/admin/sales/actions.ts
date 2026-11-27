'use server';
import { z } from 'zod';
import { formToObject, must, runAction, type ActionResult } from '@/lib/admin/action';
import { quotedAmountSchema } from '@/lib/validation/forms';
import { QUOTE_NEXT, QUOTE_STATUSES } from '@/lib/crm';

export async function updateQuote(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({
    id: z.string().uuid(),
    pricing_package_id: z.string().uuid().optional().or(z.literal('')).transform((v) => v || null),
    quoted_amount: quotedAmountSchema,
    currency: z.enum(['IDR', 'USD']),
    valid_until: z.string().optional().transform((v) => v || null).refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Invalid date.'),
    proposal_notes: z.string().trim().max(5000).optional().transform((v) => v || null),
    owner_id: z.string().uuid().optional().or(z.literal('')).transform((v) => v || null),
  });
  return runAction('crm.write', schema, formToObject(fd), async (ctx, { id, ...d }) => {
    must(await ctx.supabase.from('sales_inquiries').update(d).eq('id', id).select('id').single());
    return { ok: true, message: 'Quotation saved.' };
  }, ['/admin/sales']);
}

export async function transitionQuote(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const schema = z.object({ id: z.string().uuid(), to: z.enum(QUOTE_STATUSES) });
  const raw = formToObject(fd);
  const permission = raw.to === 'approved' ? 'sales.approve' : 'crm.write';
  return runAction(permission, schema, raw, async (ctx, d) => {
    const cur = must(await ctx.supabase.from('sales_inquiries').select('status,lead_id').eq('id', d.id).single());
    if (!QUOTE_NEXT[cur.status]?.includes(d.to)) return { error: `Cannot move from “${cur.status}” to “${d.to}”.` };
    must(await ctx.supabase.from('sales_inquiries').update({ status: d.to }).eq('id', d.id).eq('status', cur.status).select('id').single());
    if (cur.lead_id) {
      const leadStage = d.to === 'sent' ? 'proposal_sent' : d.to === 'accepted' ? 'won' : null;
      if (leadStage) await ctx.supabase.from('leads').update({ status: leadStage }).eq('id', cur.lead_id);
      await ctx.supabase.from('lead_activities').insert({ lead_id: cur.lead_id, activity_type: 'quote', notes: `Quotation moved to ${d.to.replace('_', ' ')}`, created_by: ctx.userId });
    }
    return { ok: true, message: d.to === 'sent' ? 'Marked as sent. Send the proposal yourself — NEXORA does not email clients automatically.' : 'Status updated.' };
  }, ['/admin/sales', '/admin/leads']);
}
