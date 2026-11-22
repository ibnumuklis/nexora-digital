import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, SearchX, Layers3 } from 'lucide-react';
import { getPublishedProducts, STATUS_LABELS } from '@/lib/catalog';
import { ProductCard } from '@/components/site/product-card';
import { PageHero, CtaBand } from '@/components/site/sections';
import { ButtonLink, EmptyState, inputCls } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Products',
  description: 'Explore NEXORA DIGITAL products: business management, marketing technology, education technology and AI productivity tools.',
  alternates: { canonical: '/products' },
};
export const revalidate = 300;

type SP = Promise<{ q?: string; category?: string; status?: string; sort?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 80).toLowerCase();
  const { data: all, error } = await getPublishedProducts();
  const categories = Array.from(new Map(all.flatMap((p) => (p.category ? [[p.category.slug, p.category]] : []))).values()).sort((a, b) => a.name.localeCompare(b.name));
  const statuses = Array.from(new Set(all.map((p) => p.status)));

  let list = all.filter((p) =>
    (!q || [p.name, p.short_description, p.description, p.target_market, ...p.features.map((f) => f.title)].join(' ').toLowerCase().includes(q)) &&
    (!sp.category || p.category?.slug === sp.category) &&
    (!sp.status || p.status === sp.status),
  );
  const sort = sp.sort === 'name' || sp.sort === 'newest' ? sp.sort : 'featured';
  list = [...list].sort((a, b) =>
    sort === 'name' ? a.name.localeCompare(b.name) :
    sort === 'newest' ? (b.published_at ?? '').localeCompare(a.published_at ?? '') :
    Number(b.is_featured) - Number(a.is_featured) || a.name.localeCompare(b.name));

  return (
    <>
      <PageHero eyebrow="Explore products" title={<>Digital products for <span className="text-lime">real operations.</span></>}>
        Browse ready-to-adapt products. Each listing shows its real development stage, and products with a live demo can be tried on sample data.
      </PageHero>
      <section className="section-pad pt-12">
        <div className="container-shell">
          {all.length > 0 && (
            <form role="search" className="card grid gap-3 p-4 md:grid-cols-[1fr_auto_auto_auto_auto]" action="/products">
              <label className="relative">
                <span className="sr-only">Search products</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} aria-hidden />
                <input name="q" defaultValue={sp.q} placeholder="Search products or features" className={`${inputCls} pl-10`} />
              </label>
              <label><span className="sr-only">Category</span>
                <select name="category" defaultValue={sp.category ?? ''} className={inputCls}>
                  <option value="">All categories</option>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </label>
              <label><span className="sr-only">Availability</span>
                <select name="status" defaultValue={sp.status ?? ''} className={inputCls}>
                  <option value="">Any availability</option>
                  {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
                </select>
              </label>
              <label><span className="sr-only">Sort</span>
                <select name="sort" defaultValue={sort} className={inputCls}>
                  <option value="featured">Featured first</option><option value="name">Name A–Z</option><option value="newest">Newest</option>
                </select>
              </label>
              <button className="min-h-[44px] rounded-xl bg-forest px-5 text-sm font-semibold text-white dark:bg-lime dark:text-forest">Apply</button>
            </form>
          )}
          <p className="mt-6 text-sm text-muted" aria-live="polite">{all.length > 0 && `${list.length} of ${all.length} products`}</p>
          <div className="mt-4">
            {list.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{list.map((p) => <ProductCard key={p.id} product={p} />)}</div>
            ) : all.length > 0 ? (
              <EmptyState icon={<SearchX />} title="No products match your filters" action={<Link href="/products" className="text-sm font-semibold text-accent">Clear filters</Link>}>Try a different keyword or category.</EmptyState>
            ) : (
              <EmptyState icon={<Layers3 />} title={error ? 'Catalog temporarily unavailable' : 'Products are being verified for publication'} action={<ButtonLink href="/contact?type=consultation">Ask about our products</ButtonLink>}>
                {error ? 'We could not load the catalog. Please try again shortly.' : 'Each product is published only after its description, screenshots and availability are confirmed.'}
              </EmptyState>
            )}
          </div>
        </div>
      </section>
      <CtaBand title="Need something that does not exist yet?" body="Our development team builds custom systems and integrations around your workflow." />
    </>
  );
}
