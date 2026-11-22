import { z } from 'zod';
import { requirePagePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { formToObject, must, runAction, type ActionResult } from '@/lib/admin/action';
import { slugSchema } from '@/lib/validation/forms';
import { PageHeader } from '@/components/ui';
import { DataTable, Td } from '@/components/admin/table';
import { ActionForm, SubmitButton, TextInput } from '@/components/admin/form';

export const metadata = { title: 'Categories' };

async function saveCategory(_: ActionResult, fd: FormData): Promise<ActionResult> {
  'use server';
  const schema = z.object({ id: z.string().uuid().optional().or(z.literal('')).transform((v) => v || undefined), name: z.string().trim().min(2).max(80), slug: slugSchema, description: z.string().trim().max(300).optional(), sort_order: z.coerce.number().int().min(0).max(999).default(0) });
  return runAction('catalog.write', schema, formToObject(fd), async (ctx, { id, ...d }) => {
    if (id) must(await ctx.supabase.from('product_categories').update(d).eq('id', id).select('id').single());
    else must(await ctx.supabase.from('product_categories').insert(d).select('id').single());
    return { ok: true, message: 'Category saved.' };
  }, ['/admin/categories', '/products']);
}

async function deleteCategory(_: ActionResult, fd: FormData): Promise<ActionResult> {
  'use server';
  return runAction('catalog.write', z.object({ id: z.string().uuid() }), formToObject(fd), async (ctx, d) => {
    must(await ctx.supabase.from('product_categories').delete().eq('id', d.id).select('id'));
    return { ok: true, message: 'Category deleted. Products in it are now uncategorised.' };
  }, ['/admin/categories', '/products']);
}

export default async function CategoriesPage() {
  const ctx = await requirePagePermission('catalog.read');
  const { data: cats } = await ctx.supabase.from('product_categories').select('id,name,slug,description,sort_order,products(count)').order('sort_order');
  const w = can(ctx.role, 'catalog.write');
  return (
    <>
      <PageHeader eyebrow="Catalog" title="Categories" description="Categories appear publicly only when they contain at least one published product." />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <DataTable caption="Categories" head={['Name', 'Slug', 'Products', 'Order', '']}>
          {(cats ?? []).map((c) => (
            <tr key={c.id}>
              <Td>
                {w ? (
                  <ActionForm action={saveCategory} className="grid gap-2">
                    <input type="hidden" name="id" value={c.id} /><input type="hidden" name="slug" value={c.slug} /><input type="hidden" name="sort_order" value={c.sort_order} />
                    <input name="name" defaultValue={c.name} aria-label="Category name" className="min-h-[40px] rounded-lg border border-line bg-surface px-3 text-sm" />
                    <SubmitButton variant="ghost" className="min-h-[32px] w-fit px-2 text-xs">Rename</SubmitButton>
                  </ActionForm>
                ) : c.name}
              </Td>
              <Td className="font-mono text-xs">{c.slug}</Td>
              <Td>{(c.products as unknown as { count: number }[])?.[0]?.count ?? 0}</Td>
              <Td>{c.sort_order}</Td>
              <Td>{w && <ActionForm action={deleteCategory} className="" confirm={`Delete category “${c.name}”?`}><input type="hidden" name="id" value={c.id} /><SubmitButton variant="ghost" className="min-h-[32px] text-xs text-red-600">Delete</SubmitButton></ActionForm>}</Td>
            </tr>
          ))}
        </DataTable>
        {w && (
          <aside className="card h-fit p-6"><h2 className="font-semibold">New category</h2>
            <div className="mt-4"><ActionForm action={saveCategory} resetOnSuccess>
              <TextInput name="name" label="Name" required maxLength={80} /><TextInput name="slug" label="Slug" required maxLength={100} />
              <TextInput name="description" label="Description" maxLength={300} /><TextInput name="sort_order" label="Order" type="number" defaultValue={0} />
              <SubmitButton>Create</SubmitButton>
            </ActionForm></div>
          </aside>
        )}
      </div>
    </>
  );
}
