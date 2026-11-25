import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getPublishedArticle } from '@/lib/catalog';
import { renderMarkdown } from '@/lib/markdown';
import { CtaBand } from '@/components/site/sections';
import { getI18n } from '@/lib/i18n/server';
import { formatDate } from '@/lib/i18n/config';

type P = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const [a, { t }] = await Promise.all([getPublishedArticle((await params).slug), getI18n()]);
  if (!a) return { title: t.insights.notFound, robots: { index: false } };
  return { title: a.seo_title || a.title, description: a.seo_description || a.excerpt || undefined, alternates: { canonical: `/insights/${a.slug}` }, openGraph: { type: 'article', title: a.title, publishedTime: a.published_at ?? undefined } };
}

export default async function ArticlePage({ params }: { params: P }) {
  const [a, { t, locale }] = await Promise.all([getPublishedArticle((await params).slug), getI18n()]);
  if (!a) notFound();
  return (
    <>
      <article className="section-pad">
        <div className="container-shell max-w-3xl">
          <Link href="/insights" className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-accent"><ArrowLeft size={14} aria-hidden /> {t.insights.all}</Link>
          <time className="mt-8 block text-sm text-muted" dateTime={a.published_at ?? undefined}>{formatDate(a.published_at, locale)}</time>
          <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{a.title}</h1>
          {a.excerpt && <p className="lead mt-6">{a.excerpt}</p>}
          <div className="prose-nexora mt-10">{renderMarkdown(a.body ?? '')}</div>
        </div>
      </article>
      <CtaBand />
    </>
  );
}
