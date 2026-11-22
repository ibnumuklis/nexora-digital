import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/site/legal';

export const metadata: Metadata = { title: 'Privacy policy', alternates: { canonical: '/privacy' } };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="22 November 2026">
      <h2>Who we are</h2>
      <p>NEXORA DIGITAL (“we”) operates this website and its product demos. [Legal entity name, registered address and contact email to be confirmed by the owner.]</p>
      <h2>What we collect and why</h2>
      <ul>
        <li><strong>Inquiry forms</strong> — name, email, and optionally phone, company, industry, product interest, budget and timeline, plus your message. Used to answer your request and manage the resulting sales conversation. Legal basis: your request and consent.</li>
        <li><strong>Consent records</strong> — whether you accepted this policy and, separately, whether you opted in to marketing emails, with timestamps.</li>
        <li><strong>Anonymous usage analytics</strong> — only if you choose “Allow anonymous analytics”: pages viewed (without query strings), product views, demo starts and button clicks, linked to a random per-session identifier. No advertising or third-party trackers.</li>
        <li><strong>Demo sessions</strong> — a pseudonymous visitor key (a salted one-way hash of IP address and browser string; the raw IP is not stored), start/end times and session events. Used to enforce time limits and prevent abuse.</li>
        <li><strong>Staff accounts</strong> — email and authentication data for NEXORA team members, processed by our authentication provider.</li>
      </ul>
      <h2>Retention</h2>
      <ul>
        <li>Inquiries and CRM records: up to 24 months after the last interaction, unless a contract requires longer.</li>
        <li>Analytics events: up to 13 months.</li>
        <li>Demo session records: 30 days.</li>
        <li>Security audit logs: up to 24 months.</li>
      </ul>
      <h2>Processors</h2>
      <p>Data is stored with Supabase (database, authentication and file storage; region: Tokyo, Japan). The hosting provider for this website will be listed here once confirmed. We do not sell personal data.</p>
      <h2>Your choices and rights</h2>
      <p>You can change cookie choices at any time via “Cookie settings” in the footer, unsubscribe from marketing emails, and ask us to access, correct or delete your data by contacting us. [Contact channel to be confirmed.]</p>
      <h2>Security</h2>
      <p>Access to personal data is limited by role, enforced in the database, and administrative actions are logged. No system is perfectly secure; we will notify affected people of incidents as required by law.</p>
      <p>See also our <Link href="/cookies">cookie policy</Link> and <Link href="/demo-disclaimer">demo disclaimer</Link>.</p>
    </LegalPage>
  );
}
