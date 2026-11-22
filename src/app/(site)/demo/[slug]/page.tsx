import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { getPublishedProduct } from '@/lib/catalog';
import { DemoSession } from '@/components/site/demo-session';
import { EmptyState, ButtonLink } from '@/components/ui';

export const metadata: Metadata = { title: 'Product demo', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) notFound();
  return (
    <div className="min-h-[75vh] bg-surface-2/60 py-10">
      <div className="container-shell">
        <Link href={`/products/${product.slug}`} className="inline-flex items-center gap-2 text-xs font-semibold hover:text-accent"><ArrowLeft size={14} aria-hidden /> Back to {product.name}</Link>
        <div className="mt-6">
          {product.demo_enabled ? (
            <DemoSession productSlug={product.slug} productName={product.name} />
          ) : (
            <EmptyState icon={<Lock />} title="A live demo is not available for this product yet" action={<ButtonLink href={`/contact?type=consultation&product=${product.slug}`}>Book a guided walkthrough</ButtonLink>}>
              Our team can show you the product in a live call instead.
            </EmptyState>
          )}
        </div>
      </div>
    </div>
  );
}
