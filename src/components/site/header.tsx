'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Logo } from './brand';
import { ThemeToggle } from './theme-toggle';
import { LanguageToggle, useI18n } from './i18n';
import { WhatsAppLink, WhatsAppIcon } from './whatsapp';

const NAV = [
  { key: 'products', href: '/products' },
  { key: 'solutions', href: '/solutions' },
  { key: 'services', href: '/services/custom-development' },
  { key: 'pricing', href: '/pricing' },
  { key: 'insights', href: '/insights' },
  { key: 'partners', href: '/partners' },
] as const;

export function Header() {
  const { t } = useI18n();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const cta = (
    <WhatsAppLink text={t.wa.general} label="header" className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-lime px-5 text-sm font-semibold text-forest transition hover:bg-white">
      <WhatsAppIcon size={16} /> {t.common.whatsapp}
    </WhatsAppLink>
  );
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-forest/95 text-white backdrop-blur-xl">
      <div className="container-shell flex h-[76px] items-center justify-between gap-4">
        <Logo />
        <nav aria-label={t.nav.main} className="hidden items-center gap-6 xl:gap-7 lg:flex">
          {NAV.map((l) => {
            const active = path === l.href || path.startsWith(l.href + '/');
            return (
              <Link key={l.href} href={l.href} aria-current={active ? 'page' : undefined} className={`text-sm transition hover:text-lime ${active ? 'text-lime' : 'text-white/75'}`}>
                {t.nav[l.key]}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <LanguageToggle />
          <ThemeToggle labels={{ light: t.nav.themeLight, dark: t.nav.themeDark }} />
          {cta}
        </div>
        <div className="flex items-center gap-1.5 lg:hidden">
          <LanguageToggle />
          <button className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? t.nav.closeMenu : t.nav.openMenu}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label={t.nav.mobile} className="border-t border-white/10 px-5 pb-6 pt-2 lg:hidden">
          {NAV.map((l) => (
            <Link key={l.href} className="block border-b border-white/5 py-3.5 text-white/85" href={l.href}>{t.nav[l.key]}</Link>
          ))}
          <div className="mt-5 flex items-center justify-between gap-3">{cta}<ThemeToggle labels={{ light: t.nav.themeLight, dark: t.nav.themeDark }} /></div>
        </nav>
      )}
    </header>
  );
}
