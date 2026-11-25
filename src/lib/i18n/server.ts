import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './config';
import { id } from './dictionaries/id';
import { en } from './dictionaries/en';
import type { Dict } from './dictionaries/id';

const DICTS: Record<Locale, Dict> = { id, en };

/** Locale from the visitor's saved choice; defaults to Bahasa Indonesia. */
export const getLocale = cache(async (): Promise<Locale> => {
  try {
    const v = (await cookies()).get(LOCALE_COOKIE)?.value;
    return isLocale(v) ? v : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
});

export const getI18n = cache(async () => {
  const locale = await getLocale();
  return { locale, t: DICTS[locale] };
});

export function dictFor(locale: Locale): Dict {
  return DICTS[locale];
}
