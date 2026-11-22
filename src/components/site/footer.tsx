import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Logo } from './brand';
import { CookieSettingsLink } from './consent';

const columns = [
  { title: 'Explore', links: [['Products', '/products'], ['Solutions', '/solutions'], ['Pricing', '/pricing'], ['Insights', '/insights']] },
  { title: 'Studio', links: [['Custom development', '/services/custom-development'], ['Partners & resellers', '/partners'], ['Request a quote', '/contact?type=quotation'], ['Contact', '/contact']] },
  { title: 'Legal', links: [['Privacy policy', '/privacy'], ['Terms of service', '/terms'], ['Cookie policy', '/cookies'], ['Demo disclaimer', '/demo-disclaimer']] },
] as const;

export function Footer() {
  return (
    <footer className="bg-[#0B211C] text-white">
      <div className="container-shell grid gap-10 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/60">A technology & product studio building useful digital products and tailored software for real business needs.</p>
          <p className="mt-6 font-display text-sm text-lime">Build. Innovate. Transform.</p>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <h2 className="text-sm font-semibold">{c.title}</h2>
            <ul className="mt-4 grid gap-3 text-sm text-white/60">
              {c.links.map(([n, h]) => (
                <li key={h}><Link href={h} className="hover:text-lime">{n}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-shell flex flex-col justify-between gap-3 py-6 text-xs text-white/45 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} NEXORA DIGITAL. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <CookieSettingsLink />
            <Link href="/contact" className="inline-flex items-center gap-1 text-lime">Start a conversation <ArrowUpRight size={13} aria-hidden /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
