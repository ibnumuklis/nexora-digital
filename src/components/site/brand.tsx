import Link from 'next/link';
import Image from 'next/image';

/** Official NEXORA DIGITAL logo mark (Brand Kit v1.0, transparent PNG, ratio ≈ 2.08:1). */
export function LogoMark({ height = 28 }: { height?: number }) {
  return <Image src="/brand/mark.png" alt="" width={512} height={246} priority style={{ height, width: 'auto' }} />;
}

/**
 * Horizontal lockup: mark | wordmark (+ descriptor on wide screens).
 * `tone="light"` = light artwork for dark backgrounds; `tone="dark"` = dark artwork for light backgrounds.
 */
export function Logo({ tone = 'light', sub = 'TECHNOLOGY & PRODUCT STUDIO' }: { tone?: 'light' | 'dark'; sub?: string }) {
  const onDark = tone === 'light';
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="NEXORA DIGITAL — home">
      <Image src="/brand/mark.png" alt="" width={512} height={246} priority className="h-7 w-auto sm:h-8" />
      <span className={`h-8 w-px ${onDark ? 'bg-white/25' : 'bg-line'}`} aria-hidden />
      <span className="flex flex-col">
        <Image src={onDark ? '/brand/wordmark-light.png' : '/brand/wordmark-dark.png'} alt="NEXORA DIGITAL" width={1000} height={297} priority className="h-7 w-auto sm:h-8" />
        {sub && <small className={`mt-1 hidden whitespace-nowrap text-[8.5px] tracking-[.24em] xl:block ${onDark ? 'text-white/65' : 'text-muted'}`}>{sub}</small>}
      </span>
    </Link>
  );
}
