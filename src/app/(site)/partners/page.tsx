import type { Metadata } from 'next';
import { PageHero } from '@/components/site/sections';
import { InquiryForm } from '@/components/site/inquiry-form';

export const metadata: Metadata = { title: 'Partners & resellers', description: 'White-label, reseller and technology partnerships with NEXORA DIGITAL.', alternates: { canonical: '/partners' } };

export default function PartnersPage() {
  return (
    <>
      <PageHero eyebrow="Partners" title={<>Grow with <span className="text-lime">NEXORA products.</span></>}>
        Agencies, consultants and technology partners can resell or white-label NEXORA products for their clients. Terms are agreed per partnership.
      </PageHero>
      <section className="section-pad">
        <div className="container-shell grid gap-12 lg:grid-cols-2">
          <div className="grid gap-4 self-start">
            {[
              ['Reseller', 'Offer NEXORA products to your clients with partner pricing and sales support.'],
              ['White-label', 'Deliver a product under your own brand, with NEXORA maintaining the core platform.'],
              ['Technology partner', 'Integrate your service with NEXORA products through approved APIs.'],
            ].map(([t, d]) => <div key={t} className="card p-6"><h2 className="text-lg font-semibold">{t}</h2><p className="mt-2 text-sm leading-6 text-muted">{d}</p></div>)}
          </div>
          <div className="card p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Partnership application</h2>
            <div className="mt-6"><InquiryForm defaultType="partnership" source="partner" /></div>
          </div>
        </div>
      </section>
    </>
  );
}
