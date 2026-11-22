import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ChartNoAxesCombined, Store, Building2, ArrowUpRight } from 'lucide-react';
import { getPublishedProducts } from '@/lib/catalog';
import { PageHero, CtaBand } from '@/components/site/sections';

export const metadata: Metadata = { title: 'Solutions', description: 'Solutions by industry: food & beverage and retail, marketing teams, education, and organisations that need custom software.', alternates: { canonical: '/solutions' } };
export const revalidate = 300;

const INDUSTRIES = [
  { id: 'fnb-retail', icon: Store, title: 'Food & beverage and retail', category: 'business-management', needs: ['Point of sale and daily transactions', 'Stock, suppliers and purchasing', 'Cost of goods (HPP) and margins', 'Multi-branch reporting'] },
  { id: 'marketing', icon: ChartNoAxesCombined, title: 'Marketing & multi-branch teams', category: 'marketing-technology', needs: ['Campaign planning and budgets', 'Customer and lead tracking', 'Branch activity monitoring', 'KPI dashboards and reporting'] },
  { id: 'education', icon: BookOpen, title: 'Schools & education providers', category: 'education-technology', needs: ['Teacher administration documents', 'Learning materials, tasks and quizzes', 'Schedules and results', 'Parent communication'] },
  { id: 'custom', icon: Building2, title: 'Organisations with unique processes', category: null, needs: ['Workflow automation', 'System integration', 'Internal tools and portals', 'Maintenance of existing systems'] },
] as const;

export default async function SolutionsPage() {
  const { data: products } = await getPublishedProducts();
  return (
    <>
      <PageHero eyebrow="Solutions" title={<>Start from your industry, <span className="text-lime">not from software.</span></>}>
        We map your daily operations first, then recommend a ready product, a configuration, or a custom build.
      </PageHero>
      <section className="section-pad">
        <div className="container-shell grid gap-6 lg:grid-cols-2">
          {INDUSTRIES.map((ind) => {
            const matches = ind.category ? products.filter((p) => p.category?.slug === ind.category) : [];
            return (
              <article key={ind.id} id={ind.id} className="card scroll-mt-28 p-8">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald/20 dark:text-lime"><ind.icon size={22} aria-hidden /></span>
                <h2 className="mt-6 text-2xl font-semibold">{ind.title}</h2>
                <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted">Typical needs</h3>
                <ul className="mt-3 grid gap-2 text-sm text-muted">{ind.needs.map((n) => <li key={n}>• {n}</li>)}</ul>
                {matches.length > 0 && (
                  <><h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted">Related products</h3>
                    <ul className="mt-3 flex flex-wrap gap-2">{matches.map((m) => <li key={m.id}><Link href={`/products/${m.slug}`} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-sm hover:border-accent hover:text-accent">{m.name}<ArrowUpRight size={13} aria-hidden /></Link></li>)}</ul></>
                )}
                <Link href={`/contact?type=consultation&interest=${ind.id}`} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-accent">Discuss your needs <ArrowUpRight size={15} aria-hidden /></Link>
              </article>
            );
          })}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
