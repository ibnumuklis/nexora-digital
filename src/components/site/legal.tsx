import { COMPANY } from '@/lib/company';
import { getI18n } from '@/lib/i18n/server';
import { fmt } from '@/lib/i18n/config';

export async function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = await getI18n();
  return (
    <article className="section-pad">
      <div className="container-shell max-w-3xl">
        <p className="eyebrow">{t.legal.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm text-muted">{fmt(t.legal.updated, { date: COMPANY.legalUpdated })}</p>
        <div className="prose-nexora mt-8">{children}</div>
        <ContactBlock />
      </div>
    </article>
  );
}

export async function ContactBlock() {
  const { t } = await getI18n();
  return (
    <aside className="mt-12 rounded-2xl border border-line bg-surface p-6 text-sm leading-7">
      <p className="font-semibold">{COMPANY.brand}</p>
      <p className="text-muted">{fmt(t.legal.operatedBy, { owner: COMPANY.owner })}</p>
      <p className="text-muted">{COMPANY.city}, {COMPANY.province}, {COMPANY.country}</p>
      <p className="mt-2">{t.legal.email}: <a className="font-semibold text-accent" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></p>
      <p>{t.legal.phone}: <a className="font-semibold text-accent" href={COMPANY.whatsappUrl} target="_blank" rel="noopener noreferrer">{COMPANY.phoneDisplay}</a></p>
    </aside>
  );
}
