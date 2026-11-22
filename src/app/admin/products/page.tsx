import Link from 'next/link';
import { Boxes } from 'lucide-react';
import { requirePagePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { STATUS_LABELS } from '@/lib/catalog';
import { PageHeader, Badge, EmptyState, Alert } from '@/components/ui';
import { DataTable, Td, fmtDate } from '@/components/admin/table';
import { ActionForm, SubmitButton, TextInput, SelectInput } from '@/components/admin/form';
import { createProduct } from './actions';

export const metadata = { title: 'Products' };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; pub?: string; deleted?: string }> }) {
  const ctx = await requirePagePermission('catalog.read');
  const sp = await searchParams;
  let query = ctx.supabase.from('products').select('id,name,slug,status,publication_status,verified_at,demo_enabled,is_featured,updated_at,category:product_categories(name)').order('updated_at', { ascending: false });
  if (sp.pub && ['draft', 'published', 'archived'].includes(sp.pub)) query = query.eq('publication_status', sp.pub);
  if (sp.q) query = query.ilike('name', `%${sp.q.replace(/[%_,()]/g, '').slice(0, 60)}%`);
  const [{ data: products, error }, { data: categories }] = await Promise.all([query, ctx.supabase.from('product_categories').select('id,name').order('sort_order')]);
  const canWrite = can(ctx.role, 'catalog.write');

  return (
    <>
      <PageHeader eyebrow="Catalog" title="Products" description="Draft products are invisible to the public. Publishing requires an explicit verification by an admin." />
      {sp.deleted && <Alert tone="success" className="mb-4">Product deleted.</Alert>}
      {error && <Alert tone="error" className="mb-4">Could not load products.</Alert>}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div>
          <form className="mb-4 flex flex-wrap gap-2" role="search">
            <input name="q" defaultValue={sp.q} placeholder="Search by name" aria-label="Search products" className="min-h-[44px] flex-1 rounded-xl border border-line bg-surface px-4 text-sm" />
            <select name="pub" defaultValue={sp.pub ?? ''} aria-label="Publication" className="min-h-[44px] rounded-xl border border-line bg-surface px-3 text-sm"><option value="">All</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>
            <button className="min-h-[44px] rounded-xl bg-forest px-4 text-sm font-semibold text-white dark:bg-lime dark:text-forest">Filter</button>
          </form>
          {products?.length ? (
            <DataTable caption="Products" head={['Product', 'Category', 'Stage', 'Publication', 'Verified', 'Updated']}>
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-surface-2/40">
                  <Td><Link href={`/admin/products/${p.id}`} className="font-semibold hover:text-accent">{p.name}</Link><p className="font-mono text-[11px] text-muted">{p.slug}</p></Td>
                  <Td>{(p.category as { name: string } | null)?.name ?? <span className="text-muted">—</span>}</Td>
                  <Td>{STATUS_LABELS[p.status] ?? p.status}</Td>
                  <Td><Badge tone={p.publication_status === 'published' ? 'green' : p.publication_status === 'archived' ? 'neutral' : 'amber'}>{p.publication_status}</Badge>{p.demo_enabled && <Badge tone="lime" className="ml-1">demo</Badge>}</Td>
                  <Td>{p.verified_at ? <Badge tone="green">verified</Badge> : <Badge tone="amber">unverified</Badge>}</Td>
                  <Td className="whitespace-nowrap text-xs text-muted">{fmtDate(p.updated_at)}</Td>
                </tr>
              ))}
            </DataTable>
          ) : <EmptyState icon={<Boxes />} title="No products found">{sp.q || sp.pub ? 'Try clearing filters.' : 'Create the first product record.'}</EmptyState>}
        </div>
        {canWrite && (
          <aside className="card h-fit p-6">
            <h2 className="font-semibold">New product (draft)</h2>
            <div className="mt-4">
              <ActionForm action={createProduct}>
                <TextInput name="name" label="Name" required maxLength={120} />
                <TextInput name="slug" label="URL slug" required maxLength={100} hint="lowercase-with-hyphens" />
                <SelectInput name="category_id" label="Category" options={[{ value: '', label: 'None' }, ...(categories ?? []).map((c) => ({ value: c.id, label: c.name }))]} />
                <SubmitButton>Create draft</SubmitButton>
              </ActionForm>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
