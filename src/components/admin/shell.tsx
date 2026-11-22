'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Activity, BarChart3, Boxes, FolderTree, LayoutDashboard, Lock, LogOut, Menu, Newspaper, Quote, Receipt, ShieldCheck, UserCog, Users, Wand2, X, type LucideIcon } from 'lucide-react';
import { LogoMark } from '@/components/site/brand';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { signOut } from '@/app/auth/actions';

const ICONS: Record<string, LucideIcon> = { LayoutDashboard, Boxes, FolderTree, Activity, ShieldCheck, Users, Receipt, Wand2, Newspaper, Quote, BarChart3, UserCog, Lock };

export function AdminShell({ nav, email, roleLabel, children }: { nav: { label: string; href: string; icon: string }[]; email: string; roleLabel: string; children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === '/admin' ? path === '/admin' : path === href || path.startsWith(href + '/'));
  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-3 px-2">
        <LogoMark height={22} />
        <span><b className="block font-display text-xs tracking-[.16em]">NEXORA</b><small className="text-[9px] tracking-[.2em] text-white/65">CONTROL CENTER</small></span>
      </Link>
      <nav aria-label="Admin" className="mt-8 grid gap-0.5 overflow-y-auto">
        {nav.map((n) => {
          const I = ICONS[n.icon] ?? Boxes;
          return (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={active(n.href) ? 'page' : undefined}
              className={`flex min-h-[40px] items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition ${active(n.href) ? 'bg-lime text-forest' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}>
              <I size={16} aria-hidden />{n.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4">
        <Link href="/admin/account" className="block truncate px-2 text-xs text-white/80 hover:text-lime" title={email}>{email}</Link>
        <p className="px-2 text-[10px] uppercase tracking-wider text-lime">{roleLabel}</p>
        <div className="mt-3 flex items-center gap-1">
          <Link href="/" className="flex min-h-[40px] flex-1 items-center rounded-xl px-2 text-xs text-white/60 hover:bg-white/10">View website</Link>
          <ThemeToggle className="text-white/70 hover:bg-white/10" />
          <form action={signOut}><button className="grid h-11 w-11 place-items-center rounded-full text-white/70 hover:bg-white/10" aria-label="Sign out"><LogOut size={16} aria-hidden /></button></form>
        </div>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-bg lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen bg-forest p-5 text-white lg:block">{sidebar}</aside>
      <div className="flex items-center justify-between bg-forest px-4 py-3 text-white lg:hidden">
        <Link href="/admin" className="flex items-center gap-2"><LogoMark height={20} /><b className="font-display text-xs tracking-[.16em]">NEXORA ADMIN</b></Link>
        <button onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center" aria-label="Open navigation" aria-expanded={open}><Menu /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button className="absolute inset-0 bg-black/50" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-forest p-5 text-white">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 grid h-11 w-11 place-items-center" aria-label="Close navigation"><X /></button>
            {sidebar}
          </div>
        </div>
      )}
      <main id="main" className="min-w-0 px-4 py-8 sm:px-8 lg:px-10">{children}</main>
    </div>
  );
}
