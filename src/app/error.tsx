'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[nexora] render error', error.digest ?? '');
  }, [error]);
  return (
    <main id="main" className="grid min-h-[70vh] place-items-center px-5 text-center">
      <div>
        <p className="eyebrow">Error</p>
        <h1 className="mt-4 text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted">The page could not be loaded. Please try again.{error.digest && <> Reference: <code>{error.digest}</code></>}</p>
        <div className="mt-7 flex justify-center gap-3">
          <button onClick={() => reset()} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-forest px-5 text-sm font-semibold text-white dark:bg-lime dark:text-forest"><RefreshCw size={15} aria-hidden /> Try again</button>
          <Link href="/" className="inline-flex min-h-[44px] items-center rounded-full border border-line px-5 text-sm font-semibold">Home</Link>
        </div>
      </div>
    </main>
  );
}
