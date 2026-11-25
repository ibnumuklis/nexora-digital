import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, SearchX, Layers3 } from 'lucide-react';
import { getPublishedProducts } from '@/lib/catalog';
import { ProductCard } from '@/components/site/product-card';
import { PageHero, CtaBand } from '@/components/site/sections';
import { ButtonLink, EmptyState, inputCls } from '@/components/ui';
import { getI18n } from '@/lib/i18n/server';
import { fmt } from '@/lib/i18n/config';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.products.metaTitle, description: t.products.metaDescription, alternates: { canonical: '/products' } };
}

type SP = Promise<{ q?: string; category?: string; status?: string; sort?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { t, locale } = await getI18n();
  const T = t.products;
  const q = (sp.q ?? '').trim().slice(0, 80).toLowerCase();
  const { data: all, error } = await getPublishedProducts();
  const categories = Array.from(new Map(all.flatMap((p) => (p.category ? [[p.category.slug, p.category]] : []))).values()).sort((a, b) => a.name.localeCompare(b.name, locale));
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
      <PageHero eyebrow={T.eyebrow} title={<>{T.title1} <span className="text-lime">{T.title2}</span></>}>{T.intro}</PageHero>
      <section className="section-pad pt-12">
        <div className="container-shell">
          {all.length > 0 && (
            <form role="search" className="card grid gap-3 p-4 md:grid-cols-[1fr_auto_auto_auto_auto]" action="/products">
              <label className="relative">
                <span className="sr-only">{T.search}</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} aria-hidden />
                <input name="q" defaultValue={sp.q} placeholder={T.searchPlaceholder} className={`${inputCls} pl-10`} />
              </label>
              <label><span className="sr-only">{T.category}</span>
                <select name="category" defaultValue={sp.category ?? ''} className={inputCls}>
                  <option value="">{T.allCategories}</option>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </label>
              <label><span className="sr-only">{T.availability}</span>
                <select name="status" defaultValue={sp.status ?? ''} className={inputCls}>
                  <option value="">{T.anyAvailability}</option>
                  {statuses.map((s) => <option key={s} value={s}>{t.product.status[s] ?? s}</option>)}
                </select>
              </label>
              <label><span className="sr-only">{T.sort}</span>
                <select name="sort" defaultValue={sort} className={inputCls}>
                  <option value="featured">{T.sortFeatured}</option><option value="name">{T.sortName}</option><option value="newest">{T.sortNewest}</option>
                </select>
              </label>
              <button className="min-h-[44px] rounded-xl bg-forest px-5 text-sm font-semibold text-white dark:bg-lime dark:text-forest">{T.apply}</button>
            </form>
          )}
          <p className="mt-6 text-sm text-muted" aria-live="polite">{all.length > 0 && fmt(T.count, { shown: list.length, total: all.length })}</p>
          <div className="mt-4">
            {list.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{list.map((p) => <ProductCard key={p.id} product={p} />)}</div>
            ) : all.length > 0 ? (
              <EmptyState icon={<SearchX />} title={T.noMatchTitle} action={<Link href="/products" className="text-sm font-semibold text-accent">{T.clear}</Link>}>{T.noMatchBody}</EmptyState>
            ) : (
              <EmptyState icon={<Layers3 />} title={error ? T.emptyErrorTitle : T.emptyTitle} action={<ButtonLink href="/contact?type=consultation">{T.emptyCta}</ButtonLink>}>
                {error ? T.emptyErrorBody : T.emptyBody}
              </EmptyState>
            )}
          </div>
          {all.length > 0 && <p className="mt-8 text-xs text-muted">{t.common.priceNote}</p>}
        </div>
      </section>
      <CtaBand title={T.ctaTitle} body={T.ctaBody} waText={t.wa.custom} />
    </>
  );
}
