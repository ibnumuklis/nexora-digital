import type { Metadata } from 'next';
import { PageHero, CtaBand } from '@/components/site/sections';
import { InquiryForm } from '@/components/site/inquiry-form';
import { WhatsAppButton } from '@/components/site/whatsapp';
import { getI18n } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.custom.metaTitle, description: t.custom.metaDescription, alternates: { canonical: '/services/custom-development' } };
}

export default async function CustomDevelopmentPage() {
  const { t } = await getI18n();
  const T = t.custom;
  return (
    <>
      <PageHero eyebrow={T.eyebrow} title={<>{T.title1} <span className="text-lime">{T.title2}</span></>}>
        <p>{T.intro}</p>
        <div className="mt-8"><WhatsAppButton text={t.wa.custom} label="custom_hero" /></div>
      </PageHero>
      <section className="section-pad">
        <div className="container-shell grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">{T.howTitle}</h2>
            <ol className="mt-6 grid gap-4">{T.phases.map(([title, d], i) => (
              <li key={title} className="card flex gap-5 p-6"><span className="font-display text-2xl font-semibold text-accent">0{i + 1}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted">{d}</p></div></li>
            ))}</ol>
            <h2 className="mt-12 text-2xl font-semibold">{T.whatTitle}</h2>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">{T.capabilities.map((c) => <li key={c} className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">{c}</li>)}</ul>
          </div>
          <div className="card p-6 sm:p-8 lg:self-start">
            <h2 className="text-xl font-semibold">{T.formTitle}</h2>
            <p className="mt-2 text-sm text-muted">{T.formBody}</p>
            <div className="mt-6"><InquiryForm defaultType="custom_development" source="custom_development" /></div>
          </div>
        </div>
      </section>
      <CtaBand waText={t.wa.custom} />
    </>
  );
}
