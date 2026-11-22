import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/legal';

export const metadata: Metadata = { title: 'Terms of service', alternates: { canonical: '/terms' } };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="22 November 2026">
      <h2>Use of this website</h2>
      <p>This website presents NEXORA DIGITAL products and services. Information is provided for evaluation and may change. Product availability is indicated on each product page.</p>
      <h2>Quotations and contracts</h2>
      <p>Prices, scope, licensing, updates and support are binding only when set out in a written proposal or agreement accepted by both parties. No payment is collected through this website.</p>
      <h2>Demos</h2>
      <p>Interactive demos are provided “as is” for evaluation, use synthetic data, are time-limited and may be unavailable at any time. Do not enter real personal or confidential information. Automated access, scraping or attempts to bypass session limits are prohibited.</p>
      <h2>Intellectual property</h2>
      <p>Software, designs, text and brand assets belong to NEXORA DIGITAL or their respective owners and may not be copied or redistributed without permission.</p>
      <h2>Liability</h2>
      <p>To the extent permitted by law, NEXORA DIGITAL is not liable for indirect losses arising from use of this website or demos. [Governing law and jurisdiction to be confirmed by the owner.]</p>
    </LegalPage>
  );
}
