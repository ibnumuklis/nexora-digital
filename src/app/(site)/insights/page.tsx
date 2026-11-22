import type { Metadata } from 'next';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { getPublishedArticles } from '@/lib/catalog';
import { PageHero } from '@/components/site/sections';
import { EmptyState } from '@/components/ui';

export const metadata: Metadata = { title: 'Insights', description: 'Articles and notes from the NEXORA DIGITAL studio.', alternates: { canonical: '/insights' } };
export const revalidate = 300;

export default async function InsightsPage() {
  const articles = await getPublishedArticles();
  return (
    <>
      <PageHero eyebrow="Insights" title={<>Notes from <span className="text-lime">the studio.</span></>}>Practical thinking on digital products, operations and building software that gets used.</PageHero>
      <section className="section-pad">
        <div className="container-shell">
          {articles.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {articles.map((a) => (
                <Link key={a.id} href={`/insights/${a.slug}`} className="card block p-7 transition hover:shadow-soft">
                  <time className="text-xs text-muted" dateTime={a.published_at ?? undefined}>{a.published_at ? new Date(a.published_at).toLocaleDateString('en-GB', { dateStyle: 'long' }) : ''}</time>
                  <h2 className="mt-3 text-xl font-semibold">{a.title}</h2>
                  {a.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{a.excerpt}</p>}
                  <span className="mt-5 inline-block text-sm font-semibold text-accent">Read article →</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Newspaper />} title="No articles published yet">New insights will appear here once they are reviewed and published.</EmptyState>
          )}
        </div>
      </section>
    </>
  );
}
