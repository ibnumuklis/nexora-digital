'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

const TEXT = {
  id: { title: 'Terjadi kesalahan', body: 'Halaman tidak dapat dimuat. Silakan coba lagi.', ref: 'Referensi', retry: 'Coba lagi', home: 'Beranda' },
  en: { title: 'Something went wrong', body: 'The page could not be loaded. Please try again.', ref: 'Reference', retry: 'Try again', home: 'Home' },
};

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const T = typeof document !== 'undefined' && document.documentElement.lang === 'en' ? TEXT.en : TEXT.id;
  useEffect(() => {
    console.error('[nexora] render error', error.digest ?? '');
  }, [error]);
  return (
    <main id="main" className="grid min-h-[70vh] place-items-center px-5 text-center">
      <div>
        <p className="eyebrow">Error</p>
        <h1 className="mt-4 text-3xl font-semibold">{T.title}</h1>
        <p className="mt-3 text-sm text-muted">{T.body}{error.digest && <> {T.ref}: <code>{error.digest}</code></>}</p>
        <div className="mt-7 flex justify-center gap-3">
          <button onClick={() => reset()} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-forest px-5 text-sm font-semibold text-white dark:bg-lime dark:text-forest"><RefreshCw size={15} aria-hidden /> {T.retry}</button>
          <Link href="/" className="inline-flex min-h-[44px] items-center rounded-full border border-line px-5 text-sm font-semibold">{T.home}</Link>
        </div>
      </div>
    </main>
  );
}
