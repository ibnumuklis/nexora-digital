import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/site/legal';
import { COMPANY } from '@/lib/company';

export const metadata: Metadata = { title: 'Privacy policy', description: 'How NEXORA DIGITAL collects, uses, stores and protects personal data.', alternates: { canonical: '/privacy' } };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>This policy explains how {COMPANY.brand} (“we”, “us”), a {COMPANY.legalFormEn} owned by {COMPANY.owner} and based in {COMPANY.city}, {COMPANY.country}, processes personal data when you use this website, our product demos and our services. We process personal data in line with Indonesia’s Personal Data Protection Law (Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi, “UU PDP”) and its implementing regulations. {COMPANY.brand} is the data controller.</p>

      <h2>1. Data we collect</h2>
      <ul>
        <li><strong>Inquiry and contact forms</strong> — name, email, and optionally phone/WhatsApp number, company, industry, product interest, budget range, timeline and the content of your message.</li>
        <li><strong>Consent records</strong> — that you accepted this policy (required to answer you) and, separately, whether you agreed to receive marketing updates (optional), each with a timestamp.</li>
        <li><strong>Anonymous usage analytics</strong> — collected only if you click “Allow anonymous analytics”: pages viewed (without URL parameters), product views, demo and button clicks, inquiry submissions, linked to a random identifier that lasts for one browser-tab session. No advertising or third-party tracking.</li>
        <li><strong>Demo sessions</strong> — a pseudonymous visitor key (a salted one-way hash of IP address and browser string; the IP address itself is not stored), session times and events, used to enforce time limits and prevent abuse.</li>
        <li><strong>Staff accounts</strong> — email address, password hash and sign-in records of our team members.</li>
      </ul>

      <h2>2. Purposes and legal bases</h2>
      <ul>
        <li>Answering your request, preparing proposals and quotations, and managing the resulting business relationship — your consent and steps taken at your request before entering into a contract.</li>
        <li>Sending product updates — only with your separate, optional consent, which you can withdraw at any time.</li>
        <li>Improving the website and products with aggregate statistics — your consent to analytics.</li>
        <li>Security, fraud and abuse prevention (rate limits, audit logs, demo protection) — our legitimate interest in keeping the service safe.</li>
        <li>Meeting legal obligations, such as record-keeping or lawful requests from authorities.</li>
      </ul>

      <h2>3. Retention</h2>
      <ul>
        <li>Inquiries and CRM records: up to 24 months after the last interaction, or longer if required by a contract or law.</li>
        <li>Analytics events: up to 13 months.</li>
        <li>Demo session records: 30 days.</li>
        <li>Security and audit logs: up to 24 months.</li>
      </ul>
      <p>When the retention period ends, data is deleted or irreversibly anonymised.</p>

      <h2>4. Sharing and processors</h2>
      <p>We do not sell personal data. We use the following service providers, bound by their data-processing terms:</p>
      <ul>
        <li><strong>Supabase</strong> — database, authentication and file storage (servers in Tokyo, Japan).</li>
        <li><strong>Vercel</strong> — website hosting and content delivery (global edge network).</li>
        <li><strong>GitHub</strong> — automated maintenance jobs and media rendering (processes product information, not visitor data).</li>
      </ul>
      <p>Because these providers operate outside Indonesia, your data may be transferred abroad. We rely on providers that apply security measures at least equivalent to UU PDP requirements.</p>

      <h2>5. Security</h2>
      <p>Access to personal data is limited to authorised staff by role and enforced in the database (row-level security). Connections are encrypted (HTTPS), administrative actions are logged, and passwords are stored only as hashes. No system is perfectly secure; if a data breach affects you, we will notify you and the relevant authority as required by UU PDP (in principle within 3×24 hours).</p>

      <h2>6. Your rights</h2>
      <p>Under UU PDP you may request information about, access to, correction, updating, deletion or destruction of your personal data; withdraw consent; object to certain processing; and request restriction of processing. Send your request to <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. We will verify your identity and respond within 3×24 hours where the law requires, or otherwise as soon as reasonably possible. You can change analytics choices at any time via “Cookie settings” in the footer.</p>

      <h2>7. Children</h2>
      <p>This website is intended for businesses and professionals. We do not knowingly collect data from children under 17 without consent from a parent or guardian.</p>

      <h2>8. Changes</h2>
      <p>We may update this policy. The date at the top shows the latest version; material changes will be highlighted on this page.</p>

      <p>See also the <Link href="/cookies">cookie & analytics policy</Link>, <Link href="/terms">terms of service</Link> and <Link href="/demo-disclaimer">demo disclaimer</Link>.</p>
    </LegalPage>
  );
}
