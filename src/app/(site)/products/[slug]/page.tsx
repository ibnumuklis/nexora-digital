import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Check, PlayCircle, ShieldCheck } from 'lucide-react';
import { faqItems, formatPrice, getPublishedProduct, getPublishedProducts, publicMediaUrl } from '@/lib/catalog';
import { ProductCard, ProductVisual } from '@/components/site/product-card';
import { Badge } from '@/components/ui';
import { TrackOnMount, TrackedLink } from '@/components/site/consent';
import { WhatsAppButton, WhatsAppLink, WhatsAppIcon } from '@/components/site/whatsapp';
import { siteUrl } from '@/lib/env';
import { getI18n } from '@/lib/i18n/server';
import { fmt } from '@/lib/i18n/config';

type P = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const { slug } = await params;
  const [p, { t }] = await Promise.all([getPublishedProduct(slug), getI18n()]);
  if (!p) return { title: t.detail.notFound, robots: { index: false } };
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
  const [{ data: all }, { t }] = await Promise.all([getPublishedProducts(), getI18n()]);
  const D = t.detail;
  const related = all.filter((x) => x.id !== p.id && x.category?.slug && x.category.slug === p.category?.slug).slice(0, 3);
  const faq = faqItems(p.faq);
  const screenshots = p.media.filter((m) => m.media_type === 'image').map((m) => ({ ...m, url: publicMediaUrl(m.storage_path) })).filter((m) => m.url);
  const offers = p.pricing.filter((k) => k.price_amount !== null);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: p.name,
    description: p.short_description ?? undefined,
    applicationCategory: p.category?.name ?? 'BusinessApplication',
    url: `${siteUrl()}/products/${p.slug}`,
    publisher: { '@type': 'Organization', name: 'NEXORA DIGITAL' },
    ...(offers.length ? { offers: { '@type': 'AggregateOffer', priceCurrency: 'IDR', lowPrice: Math.min(...offers.map((o) => Number(o.price_amount))), highPrice: Math.max(...offers.map((o) => Number(o.price_amount))), offerCount: offers.length } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <TrackOnMount event="product_view" productSlug={p.slug} />
      <section className="bg-forest text-white">
        <div className="container-shell grid gap-12 py-16 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-20">
          <div>
            <Link href="/products" className="inline-flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-lime"><ArrowLeft size={14} aria-hidden /> {D.all}</Link>
            <div className="mt-6 flex flex-wrap gap-2">
              {p.category && <Badge tone="lime">{p.category.name}</Badge>}
              <Badge className="bg-white/10 text-white">{t.product.status[p.status] ?? p.status}</Badge>
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-[-.04em] sm:text-6xl">{p.name}</h1>
            {p.short_description && <p className="mt-5 max-w-xl text-base leading-8 text-white/70">{p.short_description}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <WhatsAppButton text={fmt(t.wa.product, { product: p.name })} productSlug={p.slug} label="product_hero" />
              {p.demo_enabled && (
                <TrackedLink event="demo_cta_click" productSlug={p.slug} href={`/demo/${p.slug}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-lime px-5 text-sm font-semibold text-forest hover:bg-white">
                  <PlayCircle size={16} aria-hidden /> {D.tryDemo}
                </TrackedLink>
              )}
              <TrackedLink event="contact_cta_click" productSlug={p.slug} href={`/contact?type=quotation&product=${p.slug}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold hover:border-lime hover:text-lime">
                {D.quote} <ArrowUpRight size={15} aria-hidden />
              </TrackedLink>
            </div>
            {p.demo_enabled && <p className="mt-4 flex items-center gap-2 text-xs text-white/65"><ShieldCheck size={14} aria-hidden /> {D.demoNote}</p>}
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl"><ProductVisual product={p} className="h-72 sm:h-80" /></div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-shell grid gap-12 lg:grid-cols-[1.4fr_.6fr]">
          <div>
            {p.problem_statement && (<><p className="eyebrow">{D.problem}</p><p className="mt-4 text-xl leading-9">{p.problem_statement}</p></>)}
            {p.description && <div className="prose-nexora mt-8 whitespace-pre-line"><p>{p.description}</p></div>}

            {p.benefits.length > 0 && (
              <div className="mt-12"><h2 className="text-2xl font-semibold">{D.benefits}</h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">{p.benefits.map((b) => <li key={b} className="flex gap-3 text-sm leading-6"><Check className="mt-0.5 shrink-0 text-accent" size={18} aria-hidden />{b}</li>)}</ul>
              </div>
            )}

            {p.features.length > 0 && (
              <div className="mt-12"><h2 className="text-2xl font-semibold">{D.features}</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">{p.features.map((f) => (
                  <div key={f.id} className="card p-5"><h3 className="font-semibold">{f.title}</h3>{f.description && <p className="mt-2 text-sm leading-6 text-muted">{f.description}</p>}</div>
                ))}</div>
              </div>
            )}

            {screenshots.length > 0 && (
              <div className="mt-12"><h2 className="text-2xl font-semibold">{D.screenshots}</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">{screenshots.map((s) => (
                  <div key={s.id} className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-surface-2"><Image src={s.url!} alt={s.alt_text || fmt(t.product.screenshotAlt, { name: p.name })} fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" /></div>
                ))}</div>
              </div>
            )}

            {p.demo_video_url && /^https:\/\//.test(p.demo_video_url) && (
              <div className="mt-12"><h2 className="text-2xl font-semibold">{D.video}</h2>
                <a href={p.demo_video_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent"><PlayCircle size={16} aria-hidden /> {D.watch}</a>
              </div>
            )}

            <p className="mt-12 rounded-2xl bg-surface-2/60 p-4 text-xs leading-6 text-muted">{D.disclaimer} <Link href={`/contact?type=consultation&product=${p.slug}`} className="font-semibold text-accent">{D.disclaimerLink}</Link> {D.disclaimerEnd}</p>

            {faq.length > 0 && (
              <div className="mt-12"><h2 className="text-2xl font-semibold">{D.faq}</h2>
                <div className="mt-5 divide-y divide-line rounded-2xl border border-line bg-surface">{faq.map((f) => (
                  <details key={f.q} className="group p-5"><summary className="cursor-pointer list-none font-semibold marker:hidden">{f.q}</summary><p className="mt-3 text-sm leading-6 text-muted">{f.a}</p></details>
                ))}</div>
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{D.pricing}</h2>
              {p.pricing.length > 0 ? (
                <ul className="mt-4 grid gap-3">{p.pricing.map((pk) => {
                  const price = formatPrice(pk.price_amount, pk.currency);
                  return (
                    <li key={pk.id} className={`rounded-2xl border p-4 ${pk.tier === 'professional' ? 'border-accent ring-1 ring-accent/30' : 'border-line'}`}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-semibold">{pk.name}</p>
                        {price ? (
                          <p className="text-right text-xs text-muted">{t.common.startingFrom} <span className="font-display text-base font-semibold text-fg">{price}</span>{pk.billing_period === 'month' ? t.common.perMonth : ''}</p>
                        ) : <p className="text-sm font-semibold">{t.common.onRequest}</p>}
                      </div>
                      {pk.description && <p className="mt-2 text-xs leading-5 text-muted">{pk.description}</p>}
                      <WhatsAppLink text={fmt(t.wa.tier, { tier: pk.name, product: p.name })} productSlug={p.slug} label={`tier_${pk.tier ?? 'x'}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
                        <WhatsAppIcon size={13} /> {D.choose}
                      </WhatsAppLink>
                    </li>
                  );
                })}</ul>
              ) : <p className="mt-3 text-sm leading-6 text-muted">{D.pricingEmpty}</p>}
              <p className="mt-4 text-[11px] leading-5 text-muted">{t.common.priceNote}</p>
              <WhatsAppButton text={fmt(t.wa.product, { product: p.name })} productSlug={p.slug} label="product_aside" className="mt-4 w-full" />
              <Link href={`/contact?type=quotation&product=${p.slug}`} className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-line text-sm font-semibold hover:border-accent hover:text-accent">{D.quote}</Link>
            </div>
            <div className="card p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{D.glance}</h2>
              <dl className="mt-4 grid gap-4 text-sm">
                {p.target_market && <div><dt className="text-muted">{D.builtFor}</dt><dd className="mt-1 font-medium">{p.target_market}</dd></div>}
                {p.pricing_model && <div><dt className="text-muted">{D.model}</dt><dd className="mt-1 font-medium">{t.product.pricingModel[p.pricing_model] ?? p.pricing_model}</dd></div>}
                {p.technology_stack.length > 0 && <div><dt className="text-muted">{D.tech}</dt><dd className="mt-2 flex flex-wrap gap-1.5">{p.technology_stack.map((x) => <Badge key={x}>{x}</Badge>)}</dd></div>}
              </dl>
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-surface-2/60 py-20"><div className="container-shell">
          <h2 className="text-2xl font-semibold">{D.related}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">{related.map((r) => <ProductCard key={r.id} product={r} />)}</div>
        </div></section>
      )}

    </>
  );
}
