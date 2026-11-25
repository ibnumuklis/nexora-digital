import type { Metadata } from 'next';
import { Clock, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { COMPANY } from '@/lib/company';
import { getPublishedProducts } from '@/lib/catalog';
import { INQUIRY_TYPES } from '@/lib/validation/forms';
import { PageHero } from '@/components/site/sections';
import { InquiryForm } from '@/components/site/inquiry-form';
import { WhatsAppButton, WhatsAppIcon } from '@/components/site/whatsapp';
import { getI18n } from '@/lib/i18n/server';
import { fmt } from '@/lib/i18n/config';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.contact.metaTitle, description: t.contact.metaDescription, alternates: { canonical: '/contact' } };
}

type SP = Promise<{ type?: string; product?: string; interest?: string }>;

export default async function ContactPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const [{ data: products }, { t }] = await Promise.all([getPublishedProducts(), getI18n()]);
  const T = t.contact;
  const type = (INQUIRY_TYPES as readonly string[]).includes(sp.type ?? '') ? (sp.type as (typeof INQUIRY_TYPES)[number]) : 'general';
  const product = products.find((p) => p.slug === sp.product);
  const interest = sp.interest && /^[a-z0-9-]{2,40}$/.test(sp.interest) ? sp.interest : undefined;
  const waText = product ? fmt(t.wa.product, { product: product.name }) : type === 'custom_development' ? t.wa.custom : type === 'partnership' ? t.wa.partner : t.wa.general;
  const icons = [Clock, ShieldCheck, Mail];
  return (
    <>
      <PageHero eyebrow={T.eyebrow} title={<>{T.title1} <span className="text-lime">{T.title2}</span></>}>{T.intro}</PageHero>
      <section className="section-pad">
        <div className="container-shell grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
          <aside className="grid gap-4 self-start">
            <div className="rounded-3xl border border-[#25D366]/40 bg-[#25D366]/10 p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><WhatsAppIcon size={20} className="text-[#1da851]" /> {T.waTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{T.waBody}</p>
              <WhatsAppButton text={waText} productSlug={product?.slug} label="contact_card" className="mt-5 w-full" />
              <p className="mt-3 text-center text-sm font-semibold">{COMPANY.phoneDisplay}</p>
            </div>
            <div className="card grid gap-3 p-5 text-sm">
              <h2 className="font-semibold">{T.direct}</h2>
              <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-3 hover:text-accent"><Mail size={16} className="text-accent" aria-hidden />{COMPANY.email}</a>
              <p className="flex items-center gap-3 text-muted"><MapPin size={16} className="text-accent" aria-hidden />{COMPANY.city}, {COMPANY.province}, {COMPANY.country}</p>
            </div>
            {T.cards.map(([title, d], i) => {
              const Icon = icons[i];
              return <div key={title} className="card flex gap-4 p-5"><Icon className="shrink-0 text-accent" aria-hidden /><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-muted">{d}</p></div></div>;
            })}
          </aside>
          <div className="card p-6 sm:p-8">
            <h2 className="mb-6 text-xl font-semibold">{T.formTitle}</h2>
            <InquiryForm defaultType={type} allowTypeChange productSlug={product?.slug} products={products.map((p) => ({ slug: p.slug, name: p.name }))} interest={interest} />
          </div>
        </div>
      </section>
    </>
  );
}
