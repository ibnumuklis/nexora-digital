import 'server-only';
import { cache } from 'react';
import { createSupabasePublicClient } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/env';
import type { Database } from '@/lib/supabase/database.types';
import { getLocale } from '@/lib/i18n/server';
import type { Locale } from '@/lib/i18n/config';

type ProductRow = Database['public']['Tables']['products']['Row'];
export type PublicProduct = Pick<ProductRow,
  'id' | 'name' | 'slug' | 'short_description' | 'description' | 'status' | 'pricing_model' | 'is_featured' |
  'target_market' | 'benefits' | 'technology_stack' | 'problem_statement' | 'faq' | 'demo_enabled' | 'demo_video_url' |
  'application_url' | 'seo_title' | 'seo_description' | 'published_at' | 'updated_at' | 'logo_path'> & {
  translations?: unknown;
  category: { name: string; slug: string; translations?: unknown } | null;
  features: { id: string; title: string; description: string | null; sort_order: number; translations?: unknown }[];
  media: { id: string; media_type: string; storage_path: string; alt_text: string | null; sort_order: number }[];
  pricing: { id: string; name: string; tier: string | null; description: string | null; billing_period: string; price_amount: number | null; currency: string; features: unknown; sort_order: number; translations?: unknown }[];
};

const SELECT = `id,name,slug,short_description,description,status,pricing_model,is_featured,target_market,benefits,technology_stack,
problem_statement,faq,demo_enabled,demo_video_url,application_url,seo_title,seo_description,published_at,updated_at,logo_path,translations,
category:product_categories(name,slug,translations),
features:product_features(id,title,description,sort_order,translations),
media:product_media(id,media_type,storage_path,alt_text,sort_order),
pricing:pricing_packages(id,name,tier,description,billing_period,price_amount,currency,features,sort_order,translations)`;

/** Overlay `translations[locale]` (string / string[] / json fields only) on a row. Primary columns are Bahasa Indonesia. */
export function localized<T extends { translations?: unknown }>(row: T, locale: Locale, fields: readonly (keyof T & string)[]): T {
  if (locale === 'id' || !row.translations || typeof row.translations !== 'object') return row;
  const tr = (row.translations as Record<string, unknown>)[locale];
  if (!tr || typeof tr !== 'object') return row;
  const out = { ...row } as Record<string, unknown>;
  for (const f of fields) {
    const v = (tr as Record<string, unknown>)[f];
    if (typeof v === 'string' ? v.trim() !== '' : Array.isArray(v) ? v.length > 0 : false) out[f] = v;
  }
  return out as T;
}

const PRODUCT_FIELDS = ['short_description', 'problem_statement', 'description', 'target_market', 'benefits', 'faq', 'seo_title', 'seo_description'] as const;

function localizeProduct(p: PublicProduct, locale: Locale): PublicProduct {
  const base = localized(p, locale, PRODUCT_FIELDS as unknown as (keyof PublicProduct & string)[]);
  return {
    ...base,
    category: base.category ? localized(base.category, locale, ['name']) : null,
    features: base.features.map((f) => localized(f, locale, ['title', 'description'])),
    pricing: base.pricing.map((k) => localized(k, locale, ['name', 'description'])),
  };
}

export type CatalogResult<T> = { data: T; error: null } | { data: T; error: 'not_configured' | 'unavailable' };

/** Published catalog (RLS: anon sees only published rows). */
export const getPublishedProducts = cache(async (): Promise<CatalogResult<PublicProduct[]>> => {
  if (!publicEnv()) return { data: [], error: 'not_configured' };
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db.from('products').select(SELECT).eq('publication_status', 'published').order('is_featured', { ascending: false }).order('name');
    if (error) return { data: [], error: 'unavailable' };
    const locale = await getLocale();
    return { data: (data as unknown as PublicProduct[]).map((p) => localizeProduct(sortChildren(p), locale)), error: null };
  } catch {
    return { data: [], error: 'unavailable' };
  }
});

export const getPublishedProduct = cache(async (slug: string): Promise<PublicProduct | null> => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || !publicEnv()) return null;
  try {
    const db = createSupabasePublicClient();
    const { data } = await db.from('products').select(SELECT).eq('slug', slug).eq('publication_status', 'published').maybeSingle();
    return data ? localizeProduct(sortChildren(data as unknown as PublicProduct), await getLocale()) : null;
  } catch {
    return null;
  }
});

export const getPublishedArticles = cache(async () => {
  if (!publicEnv()) return [];
  try {
    const db = createSupabasePublicClient();
    const { data } = await db.from('articles').select('id,title,slug,excerpt,cover_path,published_at,seo_description,translations').eq('status', 'published').order('published_at', { ascending: false }).limit(50);
    const locale = await getLocale();
    return (data ?? []).map((a) => localized(a, locale, ['title', 'excerpt', 'seo_description']));
  } catch {
    return [];
  }
});

export const getPublishedArticle = cache(async (slug: string) => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || !publicEnv()) return null;
  try {
    const db = createSupabasePublicClient();
    const { data } = await db.from('articles').select('id,title,slug,excerpt,body,cover_path,published_at,updated_at,seo_title,seo_description,translations').eq('slug', slug).eq('status', 'published').maybeSingle();
    return data ? localized(data, await getLocale(), ['title', 'excerpt', 'body', 'seo_title', 'seo_description']) : null;
  } catch {
    return null;
  }
});

export const getPublishedTestimonials = cache(async () => {
  if (!publicEnv()) return [];
  try {
    const db = createSupabasePublicClient();
    const { data } = await db.from('testimonials').select('id,customer_name,company,quote,rating,product_id').eq('is_published', true).limit(12);
    return data ?? [];
  } catch {
    return [];
  }
});

function sortChildren(p: PublicProduct): PublicProduct {
  const by = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;
  return { ...p, features: [...(p.features ?? [])].sort(by), media: [...(p.media ?? [])].sort(by), pricing: [...(p.pricing ?? [])].sort(by) };
}

/** Public URL for images in the public bucket only. Private-bucket paths are never exposed. */
export function publicMediaUrl(path: string | null | undefined): string | null {
  const env = publicEnv();
  if (!path || !env || !path.startsWith('nexora-public/')) return null;
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path.split('/').map(encodeURIComponent).join('/')}`;
}

/** Admin-facing (English) labels. Public pages use the locale dictionary. */
export const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning', prototype: 'Prototype', development: 'In development', beta: 'Beta',
  ready_for_demo: 'Demo available', available: 'Available', maintenance: 'Maintenance', discontinued: 'Discontinued',
};

export const PRICING_MODEL_LABELS: Record<string, string> = {
  saas: 'SaaS subscription', lifetime_license: 'Lifetime license', custom_development: 'Custom development',
  maintenance: 'Maintenance & support', white_label: 'White-label / reseller', hybrid: 'Hybrid',
};

export function formatPrice(amount: number | null, currency: string): string | null {
  if (amount === null || amount === undefined) return null;
  try {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

/** Lowest public price of a product (for "starting from"). */
export function startingPrice(p: Pick<PublicProduct, 'pricing'>): { amount: number; currency: string } | null {
  const priced = p.pricing.filter((k) => k.price_amount !== null && k.price_amount !== undefined);
  if (!priced.length) return null;
  const min = priced.reduce((a, b) => (Number(b.price_amount) < Number(a.price_amount) ? b : a));
  return { amount: Number(min.price_amount), currency: min.currency };
}

export function faqItems(faq: unknown): { q: string; a: string }[] {
  if (!Array.isArray(faq)) return [];
  return faq.flatMap((f) => (f && typeof f === 'object' && typeof (f as { q?: unknown }).q === 'string' && typeof (f as { a?: unknown }).a === 'string' ? [{ q: (f as { q: string }).q, a: (f as { a: string }).a }] : []));
}
