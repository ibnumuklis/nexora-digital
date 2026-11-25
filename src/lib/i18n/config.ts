/** Locales for the public website. Bahasa Indonesia is the primary market and default. */
export const LOCALES = ['id', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'id';
export const LOCALE_COOKIE = 'nx_lang';

export function isLocale(v: unknown): v is Locale {
  return v === 'id' || v === 'en';
}

/** BCP-47 tag for Intl formatting. */
export const INTL_LOCALE: Record<Locale, string> = { id: 'id-ID', en: 'en-GB' };
export const OG_LOCALE: Record<Locale, string> = { id: 'id_ID', en: 'en_US' };

/** Simple `{name}` interpolation. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function formatDate(iso: string | null | undefined, locale: Locale, style: 'medium' | 'long' = 'long'): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(INTL_LOCALE[locale], { dateStyle: style, timeZone: 'Asia/Makassar' });
}
