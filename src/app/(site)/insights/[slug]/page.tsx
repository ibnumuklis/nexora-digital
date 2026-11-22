import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getPublishedArticle } from '@/lib/catalog';
import { renderMarkdown } from '@/lib/markdown';
import { CtaBand } from '@/components/site/sections';

export const revalidate = 300;
type P = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const a = await getPublishedArticle((await params).slug);
  if (!a) return { title: 'Article not found', robots: { index: false } };
  return { title: a.seo_title || a.title, description: a.seo_description || a.excerpt || undefined, alternates: { canonical: `/insights/${a.slug}` }, openGraph: { type: 'article', title: a.title, publishedTime: a.published_at ?? undefined } };
}

export default async function ArticlePage({ params }: { params: P }) {
  const a = await getPublishedArticle((await params).slug);
  if (!a) notFound();
  return (
    <>
      <article className="section-pad">
        <div className="container-shell max-w-3xl">
          <Link href="/insights" className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-accent"><ArrowLeft size={14} aria-hidden /> All insights</Link>
          <time className="mt-8 block text-sm text-muted" dateTime={a.published_at ?? undefined}>{a.published_at ? new Date(a.published_at).toLocaleDateString('en-GB', { dateStyle: 'long' }) : ''}</time>
          <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{a.title}</h1>
          {a.excerpt && <p className="lead mt-6">{a.excerpt}</p>}
          <div className="prose-nexora mt-10">{renderMarkdown(a.body ?? '')}</div>
        </div>
      </article>
      <CtaBand />
    </>
  );
}
