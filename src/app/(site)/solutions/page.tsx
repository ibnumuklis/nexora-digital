import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Building2, Handshake, Store, ArrowUpRight } from 'lucide-react';
import { getPublishedProducts } from '@/lib/catalog';
import { PageHero, CtaBand } from '@/components/site/sections';
import { WhatsAppButton } from '@/components/site/whatsapp';
import { getI18n } from '@/lib/i18n/server';
import { fmt } from '@/lib/i18n/config';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.solutions.metaTitle, description: t.solutions.metaDescription, alternates: { canonical: '/solutions' } };
}

const ICONS = { umkm: Store, sekolah: BookOpen, perusahaan: Building2, agensi: Handshake } as const;

export default async function SolutionsPage() {
  const [{ data: products }, { t }] = await Promise.all([getPublishedProducts(), getI18n()]);
  const T = t.solutions;
  return (
    <>
      <PageHero eyebrow={T.eyebrow} title={<>{T.title1} <span className="text-lime">{T.title2}</span></>}>{T.intro}</PageHero>
      <section className="section-pad">
        <div className="container-shell grid gap-6 lg:grid-cols-2">
          {T.industries.map((ind) => {
            const Icon = ICONS[ind.id as keyof typeof ICONS] ?? Building2;
            const matches = products.filter((p) => p.category?.slug === ind.category);
            return (
              <article key={ind.id} id={ind.id} className="card scroll-mt-28 p-8">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald/20 dark:text-lime"><Icon size={22} aria-hidden /></span>
                <h2 className="mt-6 text-2xl font-semibold">{ind.t}</h2>
                <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted">{T.needs}</h3>
                <ul className="mt-3 grid gap-2 text-sm text-muted">{ind.needs.map((n) => <li key={n}>• {n}</li>)}</ul>
                {matches.length > 0 && (
                  <><h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted">{T.related}</h3>
                    <ul className="mt-3 flex flex-wrap gap-2">{matches.map((m) => <li key={m.id}><Link href={`/products/${m.slug}`} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-sm hover:border-accent hover:text-accent">{m.name}<ArrowUpRight size={13} aria-hidden /></Link></li>)}</ul></>
                )}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <WhatsAppButton text={ind.id === 'agensi' ? t.wa.partner : fmt(t.wa.segment, { segment: ind.t })} label={`solution_${ind.id}`} variant="outline" />
                  <Link href={ind.id === 'agensi' ? '/partners' : `/contact?type=consultation&interest=${ind.id}`} className="text-sm font-semibold text-accent">{T.formLink}</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
