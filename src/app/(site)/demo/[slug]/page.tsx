import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { getPublishedProduct } from '@/lib/catalog';
import { DemoSession } from '@/components/site/demo-session';
import { EmptyState, ButtonLink } from '@/components/ui';
import { getI18n } from '@/lib/i18n/server';
import { fmt } from '@/lib/i18n/config';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.demo.metaTitle, robots: { index: false, follow: false } };
}
export const dynamic = 'force-dynamic';

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, { t }] = await Promise.all([getPublishedProduct(slug), getI18n()]);
  if (!product) notFound();
  return (
    <div className="min-h-[75vh] bg-surface-2/60 py-10">
      <div className="container-shell">
        <Link href={`/products/${product.slug}`} className="inline-flex items-center gap-2 text-xs font-semibold hover:text-accent"><ArrowLeft size={14} aria-hidden /> {fmt(t.demo.back, { product: product.name })}</Link>
        <div className="mt-6">
          {product.demo_enabled ? (
            <DemoSession productSlug={product.slug} productName={product.name} />
          ) : (
            <EmptyState icon={<Lock />} title={t.demo.unavailableTitle} action={<ButtonLink href={`/contact?type=consultation&product=${product.slug}`}>{t.demo.unavailableCta}</ButtonLink>}>
              {t.demo.unavailableBody}
            </EmptyState>
          )}
        </div>
      </div>
    </div>
  );
}
