import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { PageHero, CtaBand, EngagementGrid, PACKAGE_TIER_KEYS, TIER_NAMES } from '@/components/site/sections';
import { billingPeriodSuffix, formatPrice, getPublishedProducts } from '@/lib/catalog';
import { WhatsAppLink, WhatsAppIcon } from '@/components/site/whatsapp';
import { getI18n } from '@/lib/i18n/server';
import { fmt } from '@/lib/i18n/config';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.pricing.metaTitle, description: t.pricing.metaDescription, alternates: { canonical: '/pricing' } };
}

export default async function PricingPage() {
  const [{ t }, { data: products }] = await Promise.all([getI18n(), getPublishedProducts()]);
  const T = t.pricing;
  const priced = products.filter((p) => p.pricing.length > 0);
  return (
    <>
      <PageHero eyebrow={T.eyebrow} title={<>{T.title1} <span className="text-lime">{T.title2}</span></>}>{T.intro}</PageHero>

      <section className="section-pad">
        <div className="container-shell">
          <p className="eyebrow">{T.perProduct}</p>
          <h2 className="section-title mt-4">{T.perProductTitle}</h2>
          {priced.length > 0 ? (
            <div className="mt-10 overflow-x-auto rounded-3xl border border-line bg-surface">
              <table className="w-full min-w-[760px] text-left text-sm">
                <caption className="sr-only">{T.perProductTitle}</caption>
                <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-4">{t.nav.products}</th>
                    {PACKAGE_TIER_KEYS.map((k) => <th key={k} scope="col" className={`px-5 py-4 ${k === 'professional' ? 'text-accent' : ''}`}>{TIER_NAMES[k]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {priced.map((p) => (
                    <tr key={p.id} className="border-t border-line align-top">
                      <th scope="row" className="px-5 py-5 font-normal">
                        <Link href={`/products/${p.slug}`} className="font-semibold hover:text-accent">{p.name}</Link>
                        {p.category && <span className="mt-1 block text-xs text-muted">{p.category.name}</span>}
                      </th>
                      {PACKAGE_TIER_KEYS.map((k) => {
                        const pk = p.pricing.find((x) => x.tier === k);
                        const price = pk ? formatPrice(pk.price_amount, pk.currency) : null;
                        return (
                          <td key={k} className="px-5 py-5">
                            {price ? (
                              <><span className="block text-[11px] text-muted">{t.common.startingFrom}</span><span className="font-display text-base font-semibold">{price}</span><span className="text-xs text-muted">{billingPeriodSuffix(pk?.billing_period ?? "", t.common)}</span></>
                            ) : (
                              <WhatsAppLink text={fmt(t.wa.tier, { tier: TIER_NAMES[k], product: p.name })} productSlug={p.slug} label={`pricing_${k}`} className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline"><WhatsAppIcon size={13} /> {t.common.onRequest}</WhatsAppLink>
                            )}
                            {pk?.description && <span className="mt-1.5 block max-w-[220px] text-xs leading-5 text-muted">{pk.description}</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="mt-8 text-sm text-muted">{T.empty}</p>}
          <p className="mt-4 text-xs text-muted">{t.common.priceNote}</p>

          <h2 className="section-title mt-20">{T.tiersTitle}</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PACKAGE_TIER_KEYS.map((k) => (
              <div key={k} className={`card flex flex-col p-7 ${k === 'professional' ? 'border-accent ring-1 ring-accent/40' : ''}`}>
                <h3 className="text-xl font-semibold">{TIER_NAMES[k]}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-muted">{t.sections.tiers[k]}</p>
                <WhatsAppLink text={fmt(t.wa.tier, { tier: TIER_NAMES[k], product: 'NEXORA' })} label={`tier_card_${k}`} className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-line text-sm font-semibold hover:border-accent hover:text-accent">
                  <WhatsAppIcon size={15} /> {t.common.whatsapp}
                </WhatsAppLink>
              </div>
            ))}
          </div>
          <ul className="mt-8 grid gap-2 text-sm text-muted sm:grid-cols-2">
            {T.notes.map((x) => <li key={x} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />{x}</li>)}
          </ul>
        </div>
      </section>
      <section className="bg-surface-2/60 py-24"><div className="container-shell"><p className="eyebrow">{T.modelsEyebrow}</p><h2 className="section-title mt-4 mb-10">{T.modelsTitle}</h2><EngagementGrid /></div></section>
      <CtaBand title={T.ctaTitle} />
    </>
  );
}
