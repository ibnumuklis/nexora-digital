import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/legal';

export const metadata: Metadata = { title: 'Cookie policy', alternates: { canonical: '/cookies' } };

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie & analytics policy" updated="22 November 2026">
      <h2>Essential (always on)</h2>
      <ul>
        <li><strong>nx_consent</strong> — remembers your privacy choice (180 days).</li>
        <li><strong>nx_demo</strong> — HTTP-only session cookie that holds your demo session credential; deleted when the demo ends or the browser closes.</li>
        <li><strong>sb-* (staff only)</strong> — authentication cookies for NEXORA team members signing in to the admin console.</li>
        <li><strong>nx-theme</strong> (local storage) — your light/dark preference.</li>
      </ul>
      <h2>Analytics (only with your consent)</h2>
      <p>If you choose “Allow anonymous analytics”, the site stores a random session identifier in your browser’s session storage (cleared when the tab closes) and sends first-party events — page viewed, product viewed, demo button clicked, inquiry submitted — to our own database. URLs are stored without query strings. No data is shared with advertising networks.</p>
      <h2>Changing your choice</h2>
      <p>Use “Cookie settings” in the footer at any time. Choosing “Essential only” stops all analytics events immediately.</p>
    </LegalPage>
  );
}
