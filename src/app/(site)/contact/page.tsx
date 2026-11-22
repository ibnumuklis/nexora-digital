import type { Metadata } from 'next';
import { Clock, Mail, ShieldCheck } from 'lucide-react';
import { getPublishedProducts } from '@/lib/catalog';
import { INQUIRY_TYPES } from '@/lib/validation/forms';
import { PageHero } from '@/components/site/sections';
import { InquiryForm } from '@/components/site/inquiry-form';

export const metadata: Metadata = { title: 'Contact & consultation', description: 'Contact NEXORA DIGITAL for a consultation, a quotation, a custom development project or a partnership.', alternates: { canonical: '/contact' } };

type SP = Promise<{ type?: string; product?: string; interest?: string }>;

export default async function ContactPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const type = (INQUIRY_TYPES as readonly string[]).includes(sp.type ?? '') ? (sp.type as (typeof INQUIRY_TYPES)[number]) : 'general';
  const { data: products } = await getPublishedProducts();
  const productSlug = products.some((p) => p.slug === sp.product) ? sp.product : undefined;
  const interest = sp.interest && /^[a-z0-9-]{2,40}$/.test(sp.interest) ? sp.interest : undefined;
  return (
    <>
      <PageHero eyebrow="Contact" title={<>Let&apos;s build <span className="text-lime">something useful.</span></>}>
        Ask a question, book a consultation, request a quotation or start a custom project. One form, routed to the right person.
      </PageHero>
      <section className="section-pad">
        <div className="container-shell grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
          <aside className="grid gap-4 self-start">
            {[
              { I: Clock, t: 'Response time', d: 'We aim to reply within two business days.' },
              { I: ShieldCheck, t: 'Your data', d: 'Used only to answer your request. Marketing emails only with separate consent.' },
              { I: Mail, t: 'What happens next', d: 'A short discovery call, then a written proposal or product recommendation.' },
            ].map((x) => <div key={x.t} className="card flex gap-4 p-5"><x.I className="shrink-0 text-accent" aria-hidden /><div><h2 className="font-semibold">{x.t}</h2><p className="mt-1 text-sm leading-6 text-muted">{x.d}</p></div></div>)}
          </aside>
          <div className="card p-6 sm:p-8">
            <InquiryForm defaultType={type} allowTypeChange productSlug={productSlug} products={products.map((p) => ({ slug: p.slug, name: p.name }))} interest={interest} />
          </div>
        </div>
      </section>
    </>
  );
}
