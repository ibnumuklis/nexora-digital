'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Logo } from './brand';
import { ThemeToggle } from './theme-toggle';

export const NAV = [
  { name: 'Products', href: '/products' },
  { name: 'Solutions', href: '/solutions' },
  { name: 'Services', href: '/services/custom-development' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Insights', href: '/insights' },
  { name: 'Partners', href: '/partners' },
];

export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-forest/95 text-white backdrop-blur-xl">
      <div className="container-shell flex h-[76px] items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {NAV.map((l) => {
            const active = path === l.href || path.startsWith(l.href + '/');
            return (
              <Link key={l.href} href={l.href} aria-current={active ? 'page' : undefined} className={`text-sm transition hover:text-lime ${active ? 'text-lime' : 'text-white/75'}`}>
                {l.name}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Link href="/contact" className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-lime px-5 text-sm font-semibold text-forest transition hover:bg-white">
            Let&apos;s talk <ArrowUpRight size={15} aria-hidden />
          </Link>
        </div>
        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? 'Close menu' : 'Open menu'}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-white/10 px-5 pb-6 pt-2 lg:hidden">
          {NAV.map((l) => (
            <Link key={l.href} className="block border-b border-white/5 py-3.5 text-white/85" href={l.href}>{l.name}</Link>
          ))}
          <Link href="/contact" className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-lime px-5 text-sm font-semibold text-forest">
            Let&apos;s talk <ArrowUpRight size={15} aria-hidden />
          </Link>
        </nav>
      )}
    </header>
  );
}
