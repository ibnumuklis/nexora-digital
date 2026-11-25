import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { headers } from 'next/headers';
import { siteUrl } from '@/lib/env';
import { getI18n } from '@/lib/i18n/server';
import { OG_LOCALE } from '@/lib/i18n/config';
import './globals.css';

const sans = localFont({
  variable: '--font-sans',
  display: 'swap',
  src: [
    { path: '../../node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2', weight: '400' },
    { path: '../../node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2', weight: '500' },
    { path: '../../node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2', weight: '600' },
    { path: '../../node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2', weight: '700' },
  ],
});
const display = localFont({
  variable: '--font-display',
  display: 'swap',
  src: [
    { path: '../../node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-500-normal.woff2', weight: '500' },
    { path: '../../node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-600-normal.woff2', weight: '600' },
    { path: '../../node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff2', weight: '700' },
  ],
});

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t.meta.defaultTitle, template: '%s | NEXORA DIGITAL' },
    description: t.meta.description,
    applicationName: 'NEXORA DIGITAL',
    openGraph: { type: 'website', siteName: 'NEXORA DIGITAL', locale: OG_LOCALE[locale], alternateLocale: [OG_LOCALE[locale === 'id' ? 'en' : 'id']] },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#F7F8F5' }, { media: '(prefers-color-scheme: dark)', color: '#0B1915' }],
};

// Applies the saved/preferred theme before first paint (no flash). Kept tiny; CSP-nonced.
const THEME_SCRIPT = `try{var t=localStorage.getItem('nx-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const { locale, t } = await getI18n();
  return (
    <html lang={locale} className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-lime focus:px-4 focus:py-2 focus:text-forest">{t.common.skip}</a>
        {children}
      </body>
    </html>
  );
}
