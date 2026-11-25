import type { Metadata } from 'next';
import { PageHero } from '@/components/site/sections';
import { InquiryForm } from '@/components/site/inquiry-form';
import { WhatsAppButton } from '@/components/site/whatsapp';
import { getI18n } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.partners.metaTitle, description: t.partners.metaDescription, alternates: { canonical: '/partners' } };
}

export default async function PartnersPage() {
  const { t } = await getI18n();
  const T = t.partners;
  return (
    <>
      <PageHero eyebrow={T.eyebrow} title={<>{T.title1} <span className="text-lime">{T.title2}</span></>}>
        <p>{T.intro}</p>
        <div className="mt-8"><WhatsAppButton text={t.wa.partner} label="partner_hero" /></div>
      </PageHero>
      <section className="section-pad">
        <div className="container-shell grid gap-12 lg:grid-cols-2">
          <div className="grid gap-4 self-start">
            {T.types.map(([title, d]) => <div key={title} className="card p-6"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{d}</p></div>)}
          </div>
          <div className="card p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{T.formTitle}</h2>
            <div className="mt-6"><InquiryForm defaultType="partnership" source="partner" /></div>
          </div>
        </div>
      </section>
    </>
  );
}
