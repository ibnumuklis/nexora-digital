import Link from 'next/link';
import Image from 'next/image';

/** Official NEXORA DIGITAL logo mark (Brand Kit v1.0, transparent PNG, ratio ≈ 2.08:1). */
export function LogoMark({ height = 28 }: { height?: number }) {
  return <Image src="/brand/mark.png" alt="" width={512} height={246} priority style={{ height, width: 'auto' }} />;
}

/**
 * Wordmark set as live text, following the official horizontal lockup (banner):
 * NEXORA on top, DIGITAL justified to the same width underneath. Crisp at any size, no stretching.
 */
export function Wordmark({ tone = 'light', size = 'md' }: { tone?: 'light' | 'dark'; size?: 'sm' | 'md' }) {
  const onDark = tone === 'light';
  const top = size === 'sm' ? 'text-[15px]' : 'text-[18px] sm:text-[20px]';
  const bottom = size === 'sm' ? 'text-[7.5px]' : 'text-[9px] sm:text-[10px]';
  return (
    <span className="inline-flex flex-col leading-none" aria-hidden>
      <span className={`font-display font-bold tracking-[.02em] ${top} ${onDark ? 'text-white' : 'text-[#102C25]'}`}>NEXORA</span>
      <span className={`mt-[3px] flex justify-between font-display font-bold ${bottom} ${onDark ? 'text-[#C5F36B]' : 'text-[#16845B]'}`}>
        {'DIGITAL'.split('').map((c, i) => <span key={i}>{c}</span>)}
      </span>
    </span>
  );
}

/**
 * Horizontal lockup: mark | wordmark (+ optional descriptor on wide screens).
 * `tone="light"` = light artwork for dark backgrounds; `tone="dark"` = dark artwork for light backgrounds.
 */
export function Logo({ tone = 'light', sub }: { tone?: 'light' | 'dark'; sub?: string }) {
  const onDark = tone === 'light';
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="NEXORA DIGITAL — home">
      <Image src="/brand/mark.png" alt="" width={512} height={246} priority className="h-7 w-auto transition-transform duration-300 group-hover:-translate-y-px sm:h-8" />
      <span className={`h-8 w-px ${onDark ? 'bg-white/20' : 'bg-line'}`} aria-hidden />
      <span className="flex flex-col items-start">
        <Wordmark tone={tone} />
        {sub && <small className={`mt-1.5 hidden whitespace-nowrap text-[8px] font-semibold tracking-[.28em] sm:block ${onDark ? 'text-white/60' : 'text-muted'}`}>{sub}</small>}
      </span>
      <span className="sr-only">NEXORA DIGITAL</span>
    </Link>
  );
}
