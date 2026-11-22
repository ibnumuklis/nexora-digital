import { COMPANY } from '@/lib/company';

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="section-pad">
      <div className="container-shell max-w-3xl">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-3 text-4xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm text-muted">Effective and last updated: {COMPANY.legalUpdated}</p>
        <div className="prose-nexora mt-8">{children}</div>
        <ContactBlock />
      </div>
    </article>
  );
}

export function ContactBlock() {
  return (
    <aside className="mt-12 rounded-2xl border border-line bg-surface p-6 text-sm leading-7">
      <p className="font-semibold">{COMPANY.brand}</p>
      <p className="text-muted">{COMPANY.legalForm}, owned and operated by {COMPANY.owner}</p>
      <p className="text-muted">{COMPANY.city}, {COMPANY.province}, {COMPANY.country}</p>
      <p className="mt-2">Email: <a className="font-semibold text-accent" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></p>
      <p>Phone / WhatsApp: <a className="font-semibold text-accent" href={COMPANY.whatsappUrl} target="_blank" rel="noopener noreferrer">{COMPANY.phoneDisplay}</a></p>
    </aside>
  );
}
