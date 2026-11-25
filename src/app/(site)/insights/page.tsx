import type { Metadata } from 'next';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { getPublishedArticles } from '@/lib/catalog';
import { PageHero } from '@/components/site/sections';
import { EmptyState } from '@/components/ui';
import { getI18n } from '@/lib/i18n/server';
import { formatDate } from '@/lib/i18n/config';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.insights.metaTitle, description: t.insights.metaDescription, alternates: { canonical: '/insights' } };
}

export default async function InsightsPage() {
  const [articles, { t, locale }] = await Promise.all([getPublishedArticles(), getI18n()]);
  const T = t.insights;
  return (
    <>
      <PageHero eyebrow={T.eyebrow} title={<>{T.title1} <span className="text-lime">{T.title2}</span></>}>{T.intro}</PageHero>
      <section className="section-pad">
        <div className="container-shell">
          {articles.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {articles.map((a) => (
                <Link key={a.id} href={`/insights/${a.slug}`} className="card block p-7 transition hover:shadow-soft">
                  <time className="text-xs text-muted" dateTime={a.published_at ?? undefined}>{formatDate(a.published_at, locale)}</time>
                  <h2 className="mt-3 text-xl font-semibold">{a.title}</h2>
                  {a.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{a.excerpt}</p>}
                  <span className="mt-5 inline-block text-sm font-semibold text-accent">{T.read}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Newspaper />} title={T.emptyTitle}>{T.emptyBody}</EmptyState>
          )}
        </div>
      </section>
    </>
  );
}
