import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/legal';
import { getI18n } from '@/lib/i18n/server';
import { CookiesId } from './content-id';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.legal.titles.cookies, description: t.legal.descriptions.cookies, alternates: { canonical: '/cookies' } };
}

function CookiesEn() {
  return (
    <>
      <p>We keep tracking to a minimum. There are no advertising cookies and no third-party analytics on this website.</p>
      <h2>Essential (always active)</h2>
      <ul>
        <li><strong>nx_consent</strong> — remembers your privacy choice. First-party, 180 days.</li>
        <li><strong>nx_lang</strong> — remembers your language (Indonesian/English). First-party, 1 year.</li>
        <li><strong>nx_demo</strong> — HTTP-only, secure session cookie that holds your demo credential. Deleted when the demo ends; expires with the session.</li>
        <li><strong>sb-*</strong> — authentication cookies set only for NEXORA staff who sign in to the admin console.</li>
        <li><strong>nx-theme</strong> (local storage) — your light/dark display preference.</li>
      </ul>
      <h2>Analytics (only with your consent)</h2>
      <p>If you choose “Allow anonymous analytics”, the site stores a random identifier in session storage (cleared when you close the tab) and sends first-party events to our own database: page viewed, product viewed, search, demo, contact or WhatsApp button clicked, and inquiry submitted. Page addresses are stored without query parameters. Data is kept for up to 13 months and used only in aggregate.</p>
      <h2>Your choice</h2>
      <p>Choose “Essential only” to stop analytics immediately, or change your choice at any time via “Cookie settings” in the footer. Refusing analytics does not affect any website function.</p>
    </>
  );
}

export default async function Page() {
  const { t, locale } = await getI18n();
  return <LegalPage title={t.legal.titles.cookies}>{locale === 'id' ? <CookiesId /> : <CookiesEn />}</LegalPage>;
}
