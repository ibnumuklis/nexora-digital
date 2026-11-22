import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-[70vh] place-items-center px-5 text-center">
      <div>
        <p className="eyebrow">404 · Not found</p>
        <h1 className="mt-4 text-5xl font-semibold">This page isn&apos;t here.</h1>
        <p className="mt-4 text-sm text-muted">The page may have moved, or the product may not be published yet.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-forest px-5 text-sm font-semibold text-white dark:bg-lime dark:text-forest"><ArrowLeft size={15} aria-hidden /> Back to home</Link>
          <Link href="/products" className="inline-flex min-h-[44px] items-center rounded-full border border-line px-5 text-sm font-semibold">Browse products</Link>
        </div>
      </div>
    </main>
  );
}
