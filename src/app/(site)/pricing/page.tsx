import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { PageHero, CtaBand, EngagementGrid, PACKAGE_TIERS } from '@/components/site/sections';

export const metadata: Metadata = { title: 'Pricing & engagement models', description: 'SaaS subscription, lifetime license, custom development, maintenance and white-label. Starter, Professional, Enterprise and Custom packages priced on request.', alternates: { canonical: '/pricing' } };

export default function PricingPage() {
  return (
    <>
      <PageHero eyebrow="Pricing" title={<>Clear models. <span className="text-lime">Tailored quotes.</span></>}>
        Prices depend on modules, number of users and branches, deployment and support level. We publish a price only when it is fixed; everything else is quoted transparently.
      </PageHero>
      <section className="section-pad">
        <div className="container-shell">
          <p className="eyebrow">Packages</p>
          <h2 className="section-title mt-4">Four package levels</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PACKAGE_TIERS.map((t, i) => (
              <div key={t.key} className={`card flex flex-col p-7 ${i === 2 ? 'border-accent ring-1 ring-accent/40' : ''}`}>
                <h3 className="text-xl font-semibold">{t.name}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-muted">{t.desc}</p>
                <p className="mt-6 font-display text-lg font-semibold">Price on request</p>
                <Link href={`/contact?type=quotation&interest=${t.key}`} className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full border border-line text-sm font-semibold hover:border-accent hover:text-accent">Request {t.name} quote</Link>
              </div>
            ))}
          </div>
          <ul className="mt-8 grid gap-2 text-sm text-muted sm:grid-cols-2">
            {['Written scope, deliverables and acceptance criteria', 'Explicit license, update and support terms', 'No hidden fees — third-party costs listed separately', 'Product-specific prices shown on each product page when published'].map((x) => (
              <li key={x} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />{x}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="bg-surface-2/60 py-24"><div className="container-shell"><p className="eyebrow">Engagement models</p><h2 className="section-title mt-4 mb-10">Choose how you work with us</h2><EngagementGrid /></div></section>
      <CtaBand title="Get a quote that matches your scope" />
    </>
  );
}
