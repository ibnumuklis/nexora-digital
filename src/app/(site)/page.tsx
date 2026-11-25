import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Blocks, Building2, Check, Code2, GraduationCap, Handshake, Layers3, Sparkles, Store, Workflow } from 'lucide-react';
import { getPublishedArticles, getPublishedProducts, getPublishedTestimonials } from '@/lib/catalog';
import { ProductCard } from '@/components/site/product-card';
import { CtaBand, DemoExplainer, EngagementGrid } from '@/components/site/sections';
import { ButtonLink, EmptyState } from '@/components/ui';
import { TrackedLink } from '@/components/site/consent';
import { WhatsAppButton } from '@/components/site/whatsapp';
import { getI18n } from '@/lib/i18n/server';
import { formatDate } from '@/lib/i18n/config';

const SEGMENT_ICONS = { umkm: Store, sekolah: GraduationCap, perusahaan: Building2, agensi: Handshake } as const;
const SEGMENT_LINKS = { umkm: '/solutions#umkm', sekolah: '/solutions#sekolah', perusahaan: '/solutions#perusahaan', agensi: '/partners' } as const;

export default async function Home() {
  const [{ data: products, error }, articles, testimonials, { locale, t }] = await Promise.all([getPublishedProducts(), getPublishedArticles(), getPublishedTestimonials(), getI18n()]);
  const h = t.home;
  const featured = [...products].sort((a, b) => Number(b.is_featured) - Number(a.is_featured)).slice(0, 3);
  const categories = Array.from(new Map(products.flatMap((p) => (p.category ? [[p.category.slug, p.category]] : []))).values());
  const tileIcons = [Layers3, Code2, Sparkles, Workflow];

  return (
    <>
      <section className="relative overflow-hidden bg-forest text-white">
        <div className="grid-dots absolute inset-0 opacity-60" aria-hidden />
        <div className="absolute -right-32 -top-40 h-[560px] w-[560px] rounded-full border border-lime/10" aria-hidden />
        <div className="absolute -right-10 top-12 h-[360px] w-[360px] rounded-full border border-lime/15" aria-hidden />
        <div className="container-shell relative grid min-h-[640px] items-center gap-14 py-20 lg:grid-cols-[1.1fr_.9fr]">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[.2em] text-lime">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden /> {h.heroEyebrow}
            </p>
            <h1 className={`mt-8 max-w-3xl font-semibold leading-[1.04] tracking-[-.045em] ${locale === 'id' ? 'text-4xl sm:text-5xl lg:text-[60px]' : 'text-5xl sm:text-6xl lg:text-[72px]'}`}>
              {h.heroTitle1}<br /><span className="text-lime">{h.heroTitle2}</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/70">{h.heroBody}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <WhatsAppButton text={t.wa.general} label="hero" />
              <TrackedLink event="cta_clicked" label="hero_products" href="/products" className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold hover:border-lime hover:text-lime">{h.heroSecondary} <ArrowUpRight size={16} aria-hidden /></TrackedLink>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
              {h.heroPoints.map((p) => <li key={p} className="flex items-center gap-2"><Check size={15} className="text-lime" aria-hidden />{p}</li>)}
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-[480px]" aria-hidden>
            <div className="absolute -inset-8 rounded-[40px] bg-emerald/20 blur-3xl" />
            <div className="relative rounded-[30px] border border-white/15 bg-white/[.06] p-4 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 px-3 pb-4">
                <div className="flex gap-1.5"><i className="h-2 w-2 rounded-full bg-rose-300" /><i className="h-2 w-2 rounded-full bg-amber-300" /><i className="h-2 w-2 rounded-full bg-lime" /></div>
                <span className="text-[9px] tracking-[.2em] text-white/65">NEXORA STUDIO</span><span />
              </div>
              <div className="grid grid-cols-2 gap-3 p-3">
                {h.tiles.map((x, i) => {
                  const Icon = tileIcons[i];
                  return (
                    <div key={x.n} className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
                      <Icon className="text-lime" size={22} />
                      <p className="mt-4 text-sm font-semibold">{x.n}</p>
                      <p className="mt-1 text-[11px] text-white/65">{x.d}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mx-3 mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-[#0B211C]/70 p-5">
                <span className="text-xs font-semibold">{h.tileFooter}</span><Blocks size={17} className="text-lime" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad pb-0">
        <div className="container-shell">
          <p className="eyebrow">{h.segmentsEyebrow}</p>
          <h2 className="section-title mt-4 max-w-2xl">{h.segmentsTitle}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {h.segments.map((s) => {
              const Icon = SEGMENT_ICONS[s.id as keyof typeof SEGMENT_ICONS] ?? Store;
              return (
                <Link key={s.id} href={SEGMENT_LINKS[s.id as keyof typeof SEGMENT_LINKS] ?? '/solutions'} className="card group flex flex-col p-6 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-soft motion-reduce:hover:translate-y-0">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald/20 dark:text-lime"><Icon size={22} aria-hidden /></span>
                  <h3 className="mt-5 text-lg font-semibold">{s.t}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted">{s.d}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">{t.common.learnMore} <ArrowRight size={15} className="transition group-hover:translate-x-0.5" aria-hidden /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-shell">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">{h.productsEyebrow}</p>
              <h2 className="section-title mt-4 max-w-2xl">{h.productsTitle}</h2>
            </div>
            {products.length > 0 && <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold hover:text-accent">{h.productsAll} <ArrowRight size={16} aria-hidden /></Link>}
          </div>
          <div className="mt-12">
            {featured.length ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{featured.map((p) => <ProductCard key={p.id} product={p} />)}</div>
            ) : (
              <EmptyState icon={<Layers3 />} title={error ? h.emptyErrorTitle : h.emptyTitle} action={<ButtonLink href="/contact?type=consultation">{h.emptyCta}</ButtonLink>}>
                {error ? h.emptyErrorBody : h.emptyBody}
              </EmptyState>
            )}
          </div>
          {categories.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2">
              {categories.map((c) => <Link key={c.slug} href={`/products?category=${c.slug}`} className="rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-accent hover:text-accent">{c.name}</Link>)}
            </div>
          )}
        </div>
      </section>

      <section className="bg-surface-2/60 py-24">
        <div className="container-shell">
          <p className="eyebrow">{h.howEyebrow}</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <h2 className="section-title">{h.howTitle}</h2>
            <p className="lead">{h.howBody}</p>
          </div>
          <div className="mt-12"><EngagementGrid /></div>
          <Link href="/pricing" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-accent">{t.nav.pricing} <ArrowRight size={15} aria-hidden /></Link>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-shell">
          <p className="eyebrow">{h.demoEyebrow}</p>
          <h2 className="section-title mt-4 max-w-2xl">{h.demoTitle}</h2>
          <div className="mt-12"><DemoExplainer /></div>
          <p className="mt-6 text-xs text-muted">{h.demoNote} <Link href="/demo-disclaimer" className="font-semibold text-accent underline underline-offset-4">{h.demoNoteLink}</Link>.</p>
        </div>
      </section>

      <section className="bg-surface-2/60 py-24">
        <div className="container-shell grid gap-10 lg:grid-cols-3">
          <div>
            <p className="eyebrow">{h.whyEyebrow}</p>
            <h2 className="section-title mt-4">{h.whyTitle}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {h.why.map(([title, d]) => (
              <div key={title} className="card p-6"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="section-pad">
          <div className="container-shell">
            <p className="eyebrow">{h.testimonials}</p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {testimonials.slice(0, 3).map((x) => (
                <figure key={x.id} className="card p-7">
                  <blockquote className="text-sm leading-7">“{x.quote}”</blockquote>
                  <figcaption className="mt-5 text-sm font-semibold">{x.customer_name}{x.company && <span className="font-normal text-muted"> · {x.company}</span>}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {articles.length > 0 && (
        <section className="section-pad">
          <div className="container-shell">
            <div className="flex items-end justify-between gap-6">
              <div><p className="eyebrow">{h.insightsEyebrow}</p><h2 className="section-title mt-4">{h.insightsTitle}</h2></div>
              <Link href="/insights" className="text-sm font-semibold hover:text-accent">{h.insightsAll}</Link>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {articles.slice(0, 3).map((a) => (
                <Link key={a.id} href={`/insights/${a.slug}`} className="card block p-7 transition hover:shadow-soft">
                  <p className="text-xs text-muted">{formatDate(a.published_at, locale, 'medium')}</p>
                  <h3 className="mt-3 text-lg font-semibold">{a.title}</h3>
                  {a.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{a.excerpt}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBand />
    </>
  );
}
