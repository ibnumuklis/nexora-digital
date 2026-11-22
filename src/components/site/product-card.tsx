import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Boxes } from 'lucide-react';
import { Badge } from '@/components/ui';
import { publicMediaUrl, STATUS_LABELS, type PublicProduct } from '@/lib/catalog';

export function ProductVisual({ product, className = 'h-48' }: { product: PublicProduct; className?: string }) {
  const cover = product.media.find((m) => m.media_type === 'image');
  const url = publicMediaUrl(cover?.storage_path) ?? publicMediaUrl(product.logo_path);
  if (url) {
    return (
      <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
        <Image src={url} alt={cover?.alt_text || `${product.name} screenshot`} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover" />
      </div>
    );
  }
  // No approved screenshot yet: neutral, clearly decorative placeholder (no invented UI or data).
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald/15 via-surface-2 to-lime/20 ${className}`} aria-hidden>
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(rgb(var(--muted)/.35) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
      <div className="relative grid h-20 w-20 place-items-center rounded-3xl border border-white/60 bg-surface/80 text-accent shadow-card backdrop-blur"><Boxes size={34} /></div>
      <span className="absolute bottom-3 right-4 text-[10px] font-semibold uppercase tracking-[.18em] text-muted">Screenshot coming soon</span>
    </div>
  );
}

export function ProductCard({ product }: { product: PublicProduct }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:shadow-soft motion-reduce:hover:translate-y-0">
      <div className="relative">
        <ProductVisual product={product} />
        <div className="absolute left-4 top-4 flex gap-2">
          <Badge tone={product.status === 'available' ? 'green' : product.status === 'ready_for_demo' ? 'lime' : 'neutral'}>{STATUS_LABELS[product.status] ?? product.status}</Badge>
          {product.demo_enabled && <Badge tone="lime">Live demo</Badge>}
        </div>
      </div>
      <div className="p-6">
        {product.category && <p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">{product.category.name}</p>}
        <h3 className="mt-2 text-xl font-semibold">
          <Link href={`/products/${product.slug}`} className="hover:text-accent">{product.name}</Link>
        </h3>
        <p className="mt-3 line-clamp-3 min-h-[72px] text-sm leading-6 text-muted">{product.short_description || 'Details coming soon.'}</p>
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <Link href={`/products/${product.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-fg hover:text-accent">Explore product <ArrowUpRight size={15} aria-hidden /></Link>
        </div>
      </div>
    </article>
  );
}
