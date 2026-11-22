import { z } from 'zod';
import { Quote } from 'lucide-react';
import { requirePagePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { formToObject, must, runAction, type ActionResult } from '@/lib/admin/action';
import { PageHeader, Badge, EmptyState, Alert } from '@/components/ui';
import { ActionForm, Checkbox, SelectInput, SubmitButton, TextArea, TextInput } from '@/components/admin/form';

export const metadata = { title: 'Testimonials' };

async function saveTestimonial(_: ActionResult, fd: FormData): Promise<ActionResult> {
  'use server';
  const schema = z.object({
    customer_name: z.string().trim().min(2).max(120), company: z.string().trim().max(160).optional().transform((v) => v || null),
    quote: z.string().trim().min(10).max(800), product_id: z.string().uuid().optional().or(z.literal('')).transform((v) => v || null),
    permission: z.preprocess((v) => v === 'on', z.literal(true, { message: 'Written permission from the customer is required.' })),
    evidence: z.string().trim().min(5, 'Describe where the permission/evidence is stored.').max(300),
  });
  return runAction('content.write', schema, formToObject(fd), async (ctx, d) => {
    must(await ctx.supabase.from('testimonials').insert({ customer_name: d.customer_name, company: d.company, quote: d.quote, product_id: d.product_id, is_published: false }).select('id').single());
    await ctx.supabase.rpc('log_audit_event', { p_action: 'testimonial_evidence', p_entity_type: 'testimonials', p_metadata: { evidence: d.evidence } });
    return { ok: true, message: 'Saved as unpublished. A marketing manager or admin must publish it.' };
  }, ['/admin/testimonials']);
}

async function togglePublish(_: ActionResult, fd: FormData): Promise<ActionResult> {
  'use server';
  return runAction('content.approve', z.object({ id: z.string().uuid(), publish: z.enum(['true', 'false']) }), formToObject(fd), async (ctx, d) => {
    must(await ctx.supabase.from('testimonials').update({ is_published: d.publish === 'true' }).eq('id', d.id).select('id').single());
    return { ok: true };
  }, ['/admin/testimonials', '/']);
}

export default async function TestimonialsPage() {
  const ctx = await requirePagePermission('content.read');
  const [{ data: items }, { data: products }] = await Promise.all([
    ctx.supabase.from('testimonials').select('id,customer_name,company,quote,is_published,created_at,product:products(name)').order('created_at', { ascending: false }),
    ctx.supabase.from('products').select('id,name').order('name'),
  ]);
  return (
    <>
      <PageHeader eyebrow="Social proof" title="Testimonials" description="Only real customer statements with written permission. Never write or edit quotes on a customer's behalf." />
      <Alert tone="warning" className="mb-6">Publishing a testimonial without the customer&apos;s permission and evidence is not allowed. Evidence notes are recorded in the audit log.</Alert>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <ul className="grid content-start gap-3">
          {items?.length ? items.map((t) => (
            <li key={t.id} className="card p-5">
              <blockquote className="text-sm leading-6">“{t.quote}”</blockquote>
              <p className="mt-3 text-sm font-semibold">{t.customer_name}{t.company && <span className="font-normal text-muted"> · {t.company}</span>}{(t.product as { name: string } | null) && <span className="font-normal text-muted"> · {(t.product as { name: string }).name}</span>}</p>
              <div className="mt-3 flex items-center gap-2">{t.is_published ? <Badge tone="green">published</Badge> : <Badge>unpublished</Badge>}
                {can(ctx.role, 'content.approve') && <ActionForm action={togglePublish} className="" confirm={t.is_published ? 'Unpublish?' : 'Publish this testimonial? Confirm permission is on file.'}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="publish" value={String(!t.is_published)} /><SubmitButton variant="ghost" className="min-h-[30px] text-xs">{t.is_published ? 'Unpublish' : 'Publish'}</SubmitButton></ActionForm>}
              </div>
            </li>
          )) : <EmptyState icon={<Quote />} title="No testimonials yet">Add only verified statements from real customers.</EmptyState>}
        </ul>
        {can(ctx.role, 'content.write') && (
          <aside className="card h-fit p-6"><h2 className="font-semibold">Add testimonial</h2>
            <div className="mt-4"><ActionForm action={saveTestimonial} resetOnSuccess>
              <TextInput name="customer_name" label="Customer name" required maxLength={120} />
              <TextInput name="company" label="Company" maxLength={160} />
              <SelectInput name="product_id" label="Product" options={[{ value: '', label: 'General' }, ...(products ?? []).map((p) => ({ value: p.id, label: p.name }))]} />
              <TextArea name="quote" label="Exact quote (as approved by the customer)" required rows={4} maxLength={800} />
              <TextInput name="evidence" label="Permission evidence" required maxLength={300} hint="e.g. signed consent email of 12 Dec 2026 in shared drive" />
              <Checkbox name="permission" label="I have written permission to publish this quote." />
              <SubmitButton>Save (unpublished)</SubmitButton>
            </ActionForm></div>
          </aside>
        )}
      </div>
    </>
  );
}
