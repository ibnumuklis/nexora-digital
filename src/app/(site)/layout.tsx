import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { ConsentProvider } from '@/components/site/consent';
import { I18nProvider } from '@/components/site/i18n';
import { WhatsAppFloat } from '@/components/site/whatsapp';
import { COMPANY } from '@/lib/company';
import { siteUrl } from '@/lib/env';
import { getI18n } from '@/lib/i18n/server';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getI18n();
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: COMPANY.brand,
    slogan: COMPANY.tagline,
    description: t.meta.description,
    url: siteUrl(),
    logo: `${siteUrl()}/brand/icon-512.png`,
    email: COMPANY.email,
    telephone: COMPANY.phoneE164,
    areaServed: 'ID',
    knowsLanguage: ['id', 'en'],
    founder: { '@type': 'Person', name: COMPANY.owner },
    address: { '@type': 'PostalAddress', addressLocality: COMPANY.city, addressRegion: COMPANY.province, addressCountry: 'ID' },
    contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: COMPANY.phoneE164, email: COMPANY.email, availableLanguage: ['Indonesian', 'English'] },
  };
  return (
    <I18nProvider locale={locale} dict={t}>
      <ConsentProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd).replace(/</g, '\\u003c') }} />
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <WhatsAppFloat />
      </ConsentProvider>
    </I18nProvider>
  );
}
