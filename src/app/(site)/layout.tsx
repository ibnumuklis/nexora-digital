import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { ConsentProvider } from '@/components/site/consent';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsentProvider>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </ConsentProvider>
  );
}
