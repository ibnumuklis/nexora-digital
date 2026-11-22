import type { Metadata } from 'next';
import { Logo } from '@/components/site/brand';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-forest p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="grid-dots absolute inset-0 opacity-60" aria-hidden />
        <div className="relative"><Logo sub="CONTROL CENTER" /></div>
        <div className="relative">
          <h2 className="text-4xl font-semibold leading-tight">Build. Innovate.<br /><span className="text-lime">Transform.</span></h2>
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/60">Restricted area for NEXORA DIGITAL staff. All administrative actions are logged.</p>
        </div>
      </aside>
      <main id="main" className="flex items-center justify-center bg-bg px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo tone="dark" sub="CONTROL CENTER" /></div>
          {children}
        </div>
      </main>
    </div>
  );
}
