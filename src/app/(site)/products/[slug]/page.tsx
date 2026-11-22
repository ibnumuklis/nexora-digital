import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Check, PlayCircle, ShieldCheck } from 'lucide-react';
import { faqItems, formatPrice, getPublishedProduct, getPublishedProducts, PRICING_MODEL_LABELS, publicMediaUrl, STATUS_LABELS } from '@/lib/catalog';
import { ProductCard, ProductVisual } from '@/components/site/product-card';
import { Badge } from '@/components/ui';
import { TrackOnMount, TrackedLink } from '@/components/site/consent';
import { siteUrl } from '@/lib/env';

export const revalidate = 300;
type P = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublishedProduct(slug);
  if (!p) return { title: 'Product not found', robots: { index: false } };
  return {
    title: p.seo_title || p.name,
    description: p.seo_description || p.short_description || undefined,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title: p.seo_title || p.name, description: p.seo_description || p.short_description || undefined, url: `/products/${p.slug}` },
  };
}

export default async function ProductDetail({ params }: { params: P }) {
  const { slug } = await params;
  const p = await getPublishedProduct(slug);
  if (!p) notFound();
  const { data: all } = await getPublishedProducts();
  const related = all.filter((x) => x.id !== p.id && x.category?.slug && x.category.slug === p.category?.slug).slice(0, 3);
  const faq = faqItems(p.faq);
  const screenshots = p.media.filter((m) => m.media_type === 'image').map((m) => ({ ...m, url: publicMediaUrl(m.storage_path) })).filter((m) => m.url);
  const publicPricing = p.pricing;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: p.name,
    description: p.short_description ?? undefined,
    applicationCategory: p.category?.name ?? 'BusinessApplication',
    url: `${siteUrl()}/products/${p.slug}`,
    publisher: { '@type': 'Organization', name: 'NEXORA DIGITAL' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <TrackOnMount event="product_view" productSlug={p.slug} />
      <section className="bg-forest text-white">
        <div className="container-shell grid gap-12 py-16 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-20">
          <div>
            <Link href="/products" className="inline-flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-lime"><ArrowLeft size={14} aria-hidden /> All products</Link>
            <div className="mt-6 flex flex-wrap gap-2">
              {p.category && <Badge tone="lime">{p.category.name}</Badge>}
              <Badge className="bg-white/10 text-white">{STATUS_LABELS[p.status] ?? p.status}</Badge>
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-[-.04em] sm:text-6xl">{p.name}</h1>
            {p.short_description && <p className="mt-5 max-w-xl text-base leading-8 text-white/70">{p.short_description}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              {p.demo_enabled && (
                <TrackedLink event="demo_cta_click" productSlug={p.slug} href={`/demo/${p.slug}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-lime px-5 text-sm font-semibold text-forest hover:bg-white">
                  <PlayCircle size={16} aria-hidden /> Try the demo
                </TrackedLink>
              )}
              <TrackedLink event="contact_cta_click" productSlug={p.slug} href={`/contact?type=quotation&product=${p.slug}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold hover:border-lime hover:text-lime">
                Request a quote <ArrowUpRight size={15} aria-hidden />
              </TrackedLink>
            </div>
            {p.demo_enabled && <p className="mt-4 flex items-center gap-2 text-xs text-white/65"><ShieldCheck size={14} aria-hidden /> Timed demo session on synthetic sample data.</p>}
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl"><ProductVisual product={p} className="h-72 sm:h-80" /></div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-shell grid gap-12 lg:grid-cols-[1.4fr_.6fr]">
          <div>
            {p.problem_statement && (<><p className="eyebrow">The problem</p><p className="mt-4 text-xl leading-9">{p.problem_statement}</p></>)}
            {p.description && <div className="prose-nexora mt-8 whitespace-pre-line"><p>{p.description}</p></div>}

            {p.benefits.length > 0 && (
              <div className="mt-12"><h2 className="text-2xl font-semibold">Benefits</h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">{p.benefits.map((b) => <li key={b} className="flex gap-3 text-sm leading-6"><Check className="mt-0.5 shrink-0 text-accent" size={18} aria-hidden />{b}</li>)}</ul>
              </div>
            )}

            {p.features.length > 0 && (
              <div className="mt-12"><h2 className="text-2xl font-semibold">Features</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">{p.features.map((f) => (
                  <div key={f.id} className="card p-5"><h3 className="font-semibold">{f.title}</h3>{f.description && <p className="mt-2 text-sm leading-6 text-muted">{f.description}</p>}</div>
                ))}</div>
              </div>
            )}

            {screenshots.length > 0 && (
              <div className="mt-12"><h2 className="text-2xl font-semibold">Screenshots</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">{screenshots.map((s) => (
                  <div key={s.id} className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-surface-2"><Image src={s.url!} alt={s.alt_text || `${p.name} screenshot`} fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" /></div>
                ))}</div>
              </div>
            )}

            {p.demo_video_url && /^https:\/\//.test(p.demo_video_url) && (
              <div className="mt-12"><h2 className="text-2xl font-semibold">Demo video</h2>
                <a href={p.demo_video_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent"><PlayCircle size={16} aria-hidden /> Watch the product video</a>
              </div>
            )}

            <p className="mt-12 rounded-2xl bg-surface-2/60 p-4 text-xs leading-6 text-muted">Product information is updated as development progresses. Features, availability and commercial terms are confirmed in a written proposal — <Link href={`/contact?type=consultation&product=${p.slug}`} className="font-semibold text-accent">contact us</Link> for the current scope.</p>

            {faq.length > 0 && (
              <div className="mt-12"><h2 className="text-2xl font-semibold">FAQ</h2>
                <div className="mt-5 divide-y divide-line rounded-2xl border border-line bg-surface">{faq.map((f) => (
                  <details key={f.q} className="group p-5"><summary className="cursor-pointer list-none font-semibold marker:hidden">{f.q}</summary><p className="mt-3 text-sm leading-6 text-muted">{f.a}</p></details>
                ))}</div>
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">At a glance</h2>
              <dl className="mt-4 grid gap-4 text-sm">
                {p.target_market && <div><dt className="text-muted">Built for</dt><dd className="mt-1 font-medium">{p.target_market}</dd></div>}
                {p.pricing_model && <div><dt className="text-muted">Commercial model</dt><dd className="mt-1 font-medium">{PRICING_MODEL_LABELS[p.pricing_model] ?? p.pricing_model}</dd></div>}
                {p.technology_stack.length > 0 && <div><dt className="text-muted">Technology</dt><dd className="mt-2 flex flex-wrap gap-1.5">{p.technology_stack.map((t) => <Badge key={t}>{t}</Badge>)}</dd></div>}
              </dl>
            </div>
            <div className="card p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Pricing</h2>
              {publicPricing.length > 0 ? (
                <ul className="mt-4 grid gap-3">{publicPricing.map((pk) => (
                  <li key={pk.id} className="rounded-2xl border border-line p-4">
                    <p className="font-semibold">{pk.name}</p>
                    <p className="mt-1 text-sm text-muted">{formatPrice(pk.price_amount, pk.currency) ?? 'Price on request'}{pk.price_amount !== null && pk.billing_period !== 'custom' ? ` / ${pk.billing_period}` : ''}</p>
                    {pk.description && <p className="mt-2 text-xs leading-5 text-muted">{pk.description}</p>}
                  </li>
                ))}</ul>
              ) : <p className="mt-3 text-sm leading-6 text-muted">Pricing depends on modules, users and deployment. Request a quote for a tailored proposal.</p>}
              <Link href={`/contact?type=quotation&product=${p.slug}`} className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-forest text-sm font-semibold text-white hover:bg-emerald-600 dark:bg-lime dark:text-forest">Request a quote</Link>
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-surface-2/60 py-20"><div className="container-shell">
          <h2 className="text-2xl font-semibold">Related products</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">{related.map((r) => <ProductCard key={r.id} product={r} />)}</div>
        </div></section>
      )}
    </>
  );
}
