import Link from 'next/link';
import { z } from 'zod';
import { Newspaper } from 'lucide-react';
import { requirePagePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { formToObject, must, runAction, type ActionResult } from '@/lib/admin/action';
import { slugSchema } from '@/lib/validation/forms';
import { PageHeader, Badge, EmptyState } from '@/components/ui';
import { DataTable, Td, fmtDate } from '@/components/admin/table';
import { ActionForm, SelectInput, SubmitButton, TextArea, TextInput } from '@/components/admin/form';

export const metadata = { title: 'Articles' };

async function saveArticle(_: ActionResult, fd: FormData): Promise<ActionResult> {
  'use server';
  const schema = z.object({
    id: z.string().uuid().optional().or(z.literal('')).transform((v) => v || undefined),
    title: z.string().trim().min(3).max(160), slug: slugSchema, excerpt: z.string().trim().max(300).optional(),
    body: z.string().max(60000).optional(), status: z.enum(['draft', 'published']),
    seo_title: z.string().trim().max(70).optional(), seo_description: z.string().trim().max(170).optional(),
  });
  const raw = formToObject(fd);
  return runAction(raw.status === 'published' ? 'content.approve' : 'content.write', schema, raw, async (ctx, { id, ...d }) => {
    const patch = { ...d, published_at: d.status === 'published' ? new Date().toISOString() : null };
    if (id) {
      const cur = must(await ctx.supabase.from('articles').select('published_at,status').eq('id', id).single());
      if (cur.status === 'published' && d.status === 'published') patch.published_at = cur.published_at;
      must(await ctx.supabase.from('articles').update(patch).eq('id', id).select('id').single());
    } else must(await ctx.supabase.from('articles').insert(patch).select('id').single());
    return { ok: true, message: d.status === 'published' ? 'Article published.' : 'Draft saved.' };
  }, ['/admin/articles', '/insights', '/']);
}

async function deleteArticle(_: ActionResult, fd: FormData): Promise<ActionResult> {
  'use server';
  return runAction('content.approve', z.object({ id: z.string().uuid() }), formToObject(fd), async (ctx, d) => {
    must(await ctx.supabase.from('articles').delete().eq('id', d.id).select('id'));
    return { ok: true, message: 'Article deleted.' };
  }, ['/admin/articles', '/insights']);
}

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const ctx = await requirePagePermission('content.read');
  const { edit } = await searchParams;
  const { data: articles } = await ctx.supabase.from('articles').select('id,title,slug,status,published_at,updated_at,excerpt,body,seo_title,seo_description').order('updated_at', { ascending: false });
  const current = articles?.find((a) => a.id === edit);
  const w = can(ctx.role, 'content.write');
  const pub = can(ctx.role, 'content.approve');
  return (
    <>
      <PageHeader eyebrow="Insights CMS" title="Articles" description="Markdown subset: ## headings, **bold**, *italic*, lists, [links](https://…). Publishing requires a marketing manager or admin." />
      <div className="grid gap-6 xl:grid-cols-[1fr_520px]">
        {articles?.length ? (
          <DataTable caption="Articles" head={['Title', 'Status', 'Published', '']}>
            {articles.map((a) => (
              <tr key={a.id}>
                <Td><Link href={`?edit=${a.id}`} className="font-semibold hover:text-accent">{a.title}</Link><p className="font-mono text-[11px] text-muted">/insights/{a.slug}</p></Td>
                <Td><Badge tone={a.status === 'published' ? 'green' : 'neutral'}>{a.status}</Badge></Td>
                <Td className="text-xs">{fmtDate(a.published_at)}</Td>
                <Td>{pub && <ActionForm action={deleteArticle} className="" confirm={`Delete “${a.title}”?`}><input type="hidden" name="id" value={a.id} /><SubmitButton variant="ghost" className="min-h-[30px] text-xs text-red-600">Delete</SubmitButton></ActionForm>}</Td>
              </tr>
            ))}
          </DataTable>
        ) : <EmptyState icon={<Newspaper />} title="No articles yet" />}
        {w && (
          <aside className="card h-fit p-6">
            <h2 className="font-semibold">{current ? 'Edit article' : 'New article'}</h2>
            <div className="mt-4"><ActionForm key={current?.id ?? 'new'} action={saveArticle} resetOnSuccess={!current}>
              {current && <input type="hidden" name="id" value={current.id} />}
              <TextInput name="title" label="Title" required defaultValue={current?.title} maxLength={160} />
              <TextInput name="slug" label="Slug" required defaultValue={current?.slug} maxLength={100} />
              <TextArea name="excerpt" label="Excerpt" defaultValue={current?.excerpt} rows={2} maxLength={300} />
              <TextArea name="body" label="Body (Markdown subset)" defaultValue={current?.body} rows={14} maxLength={60000} />
              <div className="grid gap-4 sm:grid-cols-2"><TextInput name="seo_title" label="SEO title" defaultValue={current?.seo_title} maxLength={70} /><TextInput name="seo_description" label="SEO description" defaultValue={current?.seo_description} maxLength={170} /></div>
              <SelectInput name="status" label="Status" defaultValue={current?.status ?? 'draft'} options={[{ value: 'draft', label: 'Draft' }, ...(pub ? [{ value: 'published', label: 'Published' }] : [])]} />
              <SubmitButton>Save</SubmitButton>
              {current && <Link href="/admin/articles" className="text-sm text-muted">Cancel editing</Link>}
            </ActionForm></div>
          </aside>
        )}
      </div>
    </>
  );
}
