import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Blocks, Code2, Layers3, Sparkles, Workflow } from 'lucide-react';
import { getPublishedArticles, getPublishedProducts, getPublishedTestimonials } from '@/lib/catalog';
import { ProductCard } from '@/components/site/product-card';
import { CtaBand, DemoExplainer, EngagementGrid } from '@/components/site/sections';
import { ButtonLink, EmptyState } from '@/components/ui';
import { TrackedLink } from '@/components/site/consent';

export const revalidate = 300;

export default async function Home() {
  const [{ data: products, error }, articles, testimonials] = await Promise.all([getPublishedProducts(), getPublishedArticles(), getPublishedTestimonials()]);
  const featured = [...products].sort((a, b) => Number(b.is_featured) - Number(a.is_featured)).slice(0, 3);
  const categories = Array.from(new Map(products.flatMap((p) => (p.category ? [[p.category.slug, p.category]] : []))).values());

  return (
    <>
      <section className="relative overflow-hidden bg-forest text-white">
        <div className="grid-dots absolute inset-0 opacity-60" aria-hidden />
        <div className="absolute -right-32 -top-40 h-[560px] w-[560px] rounded-full border border-lime/10" aria-hidden />
        <div className="absolute -right-10 top-12 h-[360px] w-[360px] rounded-full border border-lime/15" aria-hidden />
        <div className="container-shell relative grid min-h-[640px] items-center gap-14 py-20 lg:grid-cols-[1.1fr_.9fr]">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[.2em] text-lime">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden /> Technology & Product Studio
            </p>
            <h1 className="mt-8 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-6xl lg:text-[72px]">
              Build. Innovate.<br /><span className="text-lime">Transform.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/70">
              NEXORA DIGITAL designs and builds digital products and tailored software — from ready-to-adapt SaaS to custom systems,
              maintenance and white-label partnerships.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <TrackedLink event="cta_clicked" label="hero_products" href="/products" className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-lime px-5 text-sm font-semibold text-forest hover:bg-white">Explore products <ArrowUpRight size={16} aria-hidden /></TrackedLink>
              <TrackedLink event="contact_cta_click" label="hero_project" href="/contact?type=custom_development" className="inline-flex min-h-[44px] items-center rounded-full border border-white/25 px-5 text-sm font-semibold hover:border-lime hover:text-lime">Discuss a project</TrackedLink>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[480px]" aria-hidden>
            <div className="absolute -inset-8 rounded-[40px] bg-emerald/20 blur-3xl" />
            <div className="relative rounded-[30px] border border-white/15 bg-white/[.06] p-4 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 px-3 pb-4">
                <div className="flex gap-1.5"><i className="h-2 w-2 rounded-full bg-rose-300" /><i className="h-2 w-2 rounded-full bg-amber-300" /><i className="h-2 w-2 rounded-full bg-lime" /></div>
                <span className="text-[9px] tracking-[.2em] text-white/45">NEXORA STUDIO</span><span />
              </div>
              <div className="grid grid-cols-2 gap-3 p-3">
                {[{ I: Layers3, n: 'Products', d: 'SaaS & licensed software' }, { I: Code2, n: 'Development', d: 'Custom systems' }, { I: Sparkles, n: 'Creative', d: 'Product storytelling' }, { I: Workflow, n: 'Integration', d: 'Connected tools' }].map((x) => (
                  <div key={x.n} className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
                    <x.I className="text-lime" size={22} />
                    <p className="mt-4 text-sm font-semibold">{x.n}</p>
                    <p className="mt-1 text-[11px] text-white/50">{x.d}</p>
                  </div>
                ))}
              </div>
              <div className="mx-3 mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-[#0B211C]/70 p-5">
                <span className="text-xs font-semibold">One hub. Independent products.</span><Blocks size={17} className="text-lime" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-shell">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Products</p>
              <h2 className="section-title mt-4 max-w-2xl">Tools built to move your business forward.</h2>
            </div>
            {products.length > 0 && <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold hover:text-accent">Explore all products <ArrowRight size={16} aria-hidden /></Link>}
          </div>
          <div className="mt-12">
            {featured.length ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{featured.map((p) => <ProductCard key={p.id} product={p} />)}</div>
            ) : (
              <EmptyState icon={<Layers3 />} title={error ? 'Product catalog is temporarily unavailable' : 'Our product catalog is being finalised'} action={<ButtonLink href="/contact?type=consultation">Talk to our team</ButtonLink>}>
                {error ? 'Please try again shortly.' : 'We publish a product only after its features, screenshots and availability are verified. Meanwhile, tell us what you need and we will share what is ready today.'}
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
          <p className="eyebrow">How we work with you</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <h2 className="section-title">From first idea to a product that is used.</h2>
            <p className="lead">Every engagement starts with your process and constraints. Choose the commercial model that fits — packages come as Starter, Professional, Enterprise or Custom, priced on request.</p>
          </div>
          <div className="mt-12"><EngagementGrid /></div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-shell">
          <p className="eyebrow">Interactive demos</p>
          <h2 className="section-title mt-4 max-w-2xl">Try before you talk — safely.</h2>
          <div className="mt-12"><DemoExplainer /></div>
          <p className="mt-6 text-xs text-muted">Watermarks discourage misuse but cannot prevent screenshots or recordings. See the <Link href="/demo-disclaimer" className="font-semibold text-accent underline underline-offset-4">demo disclaimer</Link>.</p>
        </div>
      </section>

      <section className="bg-surface-2/60 py-24">
        <div className="container-shell grid gap-10 lg:grid-cols-3">
          <div>
            <p className="eyebrow">Why NEXORA</p>
            <h2 className="section-title mt-4">Practical technology, honestly delivered.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {[
              ['Independent products', 'Each product keeps its own deployment and data boundary. NEXORA connects them; it never merges your data.'],
              ['Security by default', 'Role-based access, row-level security and audited admin actions are built in from day one.'],
              ['Transparent status', 'We label every product by its real stage — planning, prototype, beta or available.'],
              ['Clear commercial terms', 'Scope, licensing, updates and support are written down before work starts.'],
            ].map(([t, d]) => (
              <div key={t} className="card p-6"><h3 className="font-semibold">{t}</h3><p className="mt-2 text-sm leading-6 text-muted">{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="section-pad">
          <div className="container-shell">
            <p className="eyebrow">What clients say</p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {testimonials.slice(0, 3).map((t) => (
                <figure key={t.id} className="card p-7">
                  <blockquote className="text-sm leading-7">“{t.quote}”</blockquote>
                  <figcaption className="mt-5 text-sm font-semibold">{t.customer_name}{t.company && <span className="font-normal text-muted"> · {t.company}</span>}</figcaption>
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
              <div><p className="eyebrow">Insights</p><h2 className="section-title mt-4">Latest from the studio</h2></div>
              <Link href="/insights" className="text-sm font-semibold hover:text-accent">All insights →</Link>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {articles.slice(0, 3).map((a) => (
                <Link key={a.id} href={`/insights/${a.slug}`} className="card block p-7 transition hover:shadow-soft">
                  <p className="text-xs text-muted">{a.published_at ? new Date(a.published_at).toLocaleDateString('en-GB', { dateStyle: 'medium' }) : ''}</p>
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
