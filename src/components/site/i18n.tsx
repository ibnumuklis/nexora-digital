'use client';
import { createContext, useContext, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { LOCALE_COOKIE, type Locale } from '@/lib/i18n/config';
import type { Dict } from '@/lib/i18n/dictionaries/id';

const Ctx = createContext<{ locale: Locale; t: Dict } | null>(null);

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: React.ReactNode }) {
  return <Ctx.Provider value={{ locale, t: dict }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n must be used inside I18nProvider');
  return v;
}

/** ID / EN switch. Stores the choice in a first-party cookie (1 year) and re-renders server content. */
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (next: Locale) => {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    document.documentElement.lang = next;
    start(() => router.refresh());
  };
  return (
    <div role="group" aria-label={t.nav.language} className={`inline-flex items-center rounded-full border border-white/15 p-0.5 text-[11px] font-bold ${pending ? 'opacity-60' : ''} ${className}`}>
      <Languages size={13} className="mx-1.5 hidden text-white/60 sm:block" aria-hidden />
      {(['id', 'en'] as const).map((l) => (
        <button key={l} type="button" onClick={() => set(l)} aria-pressed={locale === l} lang={l}
          aria-label={l === 'id' ? 'Bahasa Indonesia' : 'English'}
          className={`min-h-[30px] rounded-full px-2.5 uppercase tracking-wider transition ${locale === l ? 'bg-lime text-forest' : 'text-white/70 hover:text-white'}`}>
          {l}
        </button>
      ))}
    </div>
  );
}
