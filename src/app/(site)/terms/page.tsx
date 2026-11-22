import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/site/legal';
import { COMPANY } from '@/lib/company';

export const metadata: Metadata = { title: 'Terms of service', description: 'Terms governing use of the NEXORA DIGITAL website, demos and inquiries.', alternates: { canonical: '/terms' } };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service">
      <p>These terms govern your use of this website and its product demos, operated by {COMPANY.brand}, a {COMPANY.legalFormEn} owned by {COMPANY.owner}, {COMPANY.city}, {COMPANY.country}. By using the website you agree to these terms.</p>

      <h2>1. Information on this website</h2>
      <p>Product descriptions, features, development stages and availability are provided in good faith for evaluation and may change as products evolve. Each product page shows its current stage (for example prototype, in development or available). Nothing on this website is a binding offer.</p>

      <h2>2. Quotations, contracts and payment</h2>
      <p>Prices, scope, deliverables, licensing, updates, support levels and payment terms become binding only when set out in a written proposal or agreement accepted by both parties. Unless stated otherwise, prices are in Indonesian Rupiah (IDR) and exclude applicable taxes. No payments are collected through this website.</p>

      <h2>3. Licences and intellectual property</h2>
      <p>The website, software, designs, text, logos and the NEXORA DIGITAL brand are owned by {COMPANY.brand} or its licensors. You may not copy, modify, distribute, reverse-engineer or create derivative works from them except as permitted by law or by a written licence. Ownership of custom-developed work is defined in the relevant project agreement.</p>

      <h2>4. Demos</h2>
      <p>Demos are provided “as is” for evaluation only, run on synthetic data, are time-limited and may be unavailable or reset at any time. You must not enter real personal, financial or confidential information, attempt to bypass session limits or security controls, automate access, scrape content, or use demo content for any other purpose. See the <Link href="/demo-disclaimer">demo disclaimer</Link>.</p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to misuse the website, including by attempting unauthorised access, introducing malware, overloading the service, submitting false or abusive inquiries, or infringing the rights of others. We may block access that violates these terms.</p>

      <h2>6. Third-party links</h2>
      <p>Links to third-party sites are provided for convenience. We are not responsible for their content or practices.</p>

      <h2>7. Limitation of liability</h2>
      <p>To the maximum extent permitted by Indonesian law, {COMPANY.brand} is not liable for indirect, incidental or consequential losses, loss of data or profit arising from use of the website or demos. Nothing in these terms limits liability that cannot be limited by law. Liability for paid services is governed by the applicable agreement.</p>

      <h2>8. Personal data</h2>
      <p>Our processing of personal data is described in the <Link href="/privacy">privacy policy</Link>.</p>

      <h2>9. Governing law and disputes</h2>
      <p>These terms are governed by the laws of the Republic of Indonesia. The parties will first seek to resolve any dispute amicably through deliberation (musyawarah). If no settlement is reached within 30 days, the dispute will be submitted to the Makassar District Court (Pengadilan Negeri Makassar).</p>

      <h2>10. Changes</h2>
      <p>We may update these terms; the date at the top indicates the current version. Continued use after an update means you accept the revised terms.</p>
    </LegalPage>
  );
}
