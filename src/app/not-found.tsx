import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getI18n } from '@/lib/i18n/server';

export default async function NotFound() {
  const { t } = await getI18n();
  const T = t.notFound;
  return (
    <main id="main" className="grid min-h-[70vh] place-items-center px-5 text-center">
      <div>
        <p className="eyebrow">{T.eyebrow}</p>
        <h1 className="mt-4 text-5xl font-semibold">{T.title}</h1>
        <p className="mt-4 text-sm text-muted">{T.body}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-forest px-5 text-sm font-semibold text-white dark:bg-lime dark:text-forest"><ArrowLeft size={15} aria-hidden /> {T.home}</Link>
          <Link href="/products" className="inline-flex min-h-[44px] items-center rounded-full border border-line px-5 text-sm font-semibold">{T.products}</Link>
        </div>
      </div>
    </main>
  );
}
