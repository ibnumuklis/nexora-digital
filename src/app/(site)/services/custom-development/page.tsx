import type { Metadata } from 'next';
import { PageHero, CtaBand } from '@/components/site/sections';
import { InquiryForm } from '@/components/site/inquiry-form';

export const metadata: Metadata = { title: 'Custom development', description: 'Custom web applications, workflow automation, integrations and maintenance by NEXORA DIGITAL.', alternates: { canonical: '/services/custom-development' } };

const PHASES = [
  ['Discovery', 'Workshops to map your process, users, data and constraints. Output: scope and estimate.'],
  ['Design', 'User flows and interface designs reviewed with your team before build.'],
  ['Build & test', 'Iterative delivery with demos, automated tests and security review.'],
  ['Launch & support', 'Deployment, training, documentation and an agreed maintenance plan.'],
];
const CAPABILITIES = ['Web applications & dashboards', 'Admin panels and internal tools', 'Workflow automation', 'API & system integration', 'Data migration', 'Maintenance of existing systems'];

export default function CustomDevelopmentPage() {
  return (
    <>
      <PageHero eyebrow="Custom development" title={<>Software shaped around <span className="text-lime">your process.</span></>}>
        When no product fits, we design and build one with you — with clear scope, transparent estimates and code you can maintain.
      </PageHero>
      <section className="section-pad">
        <div className="container-shell grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">How a project runs</h2>
            <ol className="mt-6 grid gap-4">{PHASES.map(([t, d], i) => (
              <li key={t} className="card flex gap-5 p-6"><span className="font-display text-2xl font-semibold text-accent">0{i + 1}</span><div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm leading-6 text-muted">{d}</p></div></li>
            ))}</ol>
            <h2 className="mt-12 text-2xl font-semibold">What we build</h2>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">{CAPABILITIES.map((c) => <li key={c} className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">{c}</li>)}</ul>
          </div>
          <div className="card p-6 sm:p-8 lg:self-start">
            <h2 className="text-xl font-semibold">Tell us about your project</h2>
            <p className="mt-2 text-sm text-muted">We usually reply within two business days.</p>
            <div className="mt-6"><InquiryForm defaultType="custom_development" source="custom_development" /></div>
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
