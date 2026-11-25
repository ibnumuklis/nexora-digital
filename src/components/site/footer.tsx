import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Logo } from './brand';
import { CookieSettingsLink } from './consent';
import { COMPANY } from '@/lib/company';
import { getI18n } from '@/lib/i18n/server';

export async function Footer() {
  const { t } = await getI18n();
  const L = t.footer.links;
  const columns = [
    { title: t.footer.explore, links: [[L.products, '/products'], [L.solutions, '/solutions'], [L.pricing, '/pricing'], [L.insights, '/insights']] },
    { title: t.footer.studio, links: [[L.custom, '/services/custom-development'], [L.partners, '/partners'], [L.quote, '/contact?type=quotation'], [L.contact, '/contact']] },
    { title: t.footer.legal, links: [[L.privacy, '/privacy'], [L.terms, '/terms'], [L.cookies, '/cookies'], [L.demo, '/demo-disclaimer']] },
  ];
  return (
    <footer className="bg-[#0B211C] text-white">
      <div className="container-shell grid gap-10 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/60">{t.footer.about}</p>
          <p className="mt-6 font-display text-sm text-lime">{COMPANY.tagline}</p>
          <address className="mt-6 grid gap-1 text-sm not-italic text-white/65">
            <span>{COMPANY.city}, {COMPANY.province}, {COMPANY.country}</span>
            <a href={`mailto:${COMPANY.email}`} className="hover:text-lime">{COMPANY.email}</a>
            <a href={COMPANY.whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-lime">WhatsApp {COMPANY.phoneDisplay}</a>
          </address>
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
        <div className="container-shell flex flex-col justify-between gap-3 py-6 pr-20 text-xs text-white/65 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} NEXORA DIGITAL · {COMPANY.owner} ({t.footer.legalForm}), {COMPANY.city}. {t.footer.rights}</span>
          <div className="flex items-center gap-5">
            <CookieSettingsLink />
            <Link href="/contact" className="inline-flex items-center gap-1 text-lime">{t.footer.start} <ArrowUpRight size={13} aria-hidden /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
