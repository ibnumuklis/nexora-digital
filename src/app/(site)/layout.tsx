import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { ConsentProvider } from '@/components/site/consent';
import { COMPANY } from '@/lib/company';
import { siteUrl } from '@/lib/env';

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: COMPANY.brand,
  slogan: COMPANY.tagline,
  description: COMPANY.descriptor,
  url: siteUrl(),
  logo: `${siteUrl()}/brand/icon-512.png`,
  email: COMPANY.email,
  telephone: COMPANY.phoneE164,
  founder: { '@type': 'Person', name: COMPANY.owner },
  address: { '@type': 'PostalAddress', addressLocality: COMPANY.city, addressRegion: COMPANY.province, addressCountry: 'ID' },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsentProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd).replace(/</g, '\\u003c') }} />
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </ConsentProvider>
  );
}
