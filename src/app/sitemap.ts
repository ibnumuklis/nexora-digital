import type { MetadataRoute } from 'next';
import { getPublishedArticles, getPublishedProducts } from '@/lib/catalog';
import { siteUrl } from '@/lib/env';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticPaths = ['', '/products', '/solutions', '/services/custom-development', '/pricing', '/partners', '/insights', '/contact', '/privacy', '/terms', '/cookies', '/demo-disclaimer'];
  const [{ data: products }, articles] = await Promise.all([getPublishedProducts(), getPublishedArticles()]);
  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updated_at, priority: 0.8 })),
    ...articles.map((a) => ({ url: `${base}/insights/${a.slug}`, lastModified: a.published_at ?? undefined, priority: 0.6 })),
  ];
}
