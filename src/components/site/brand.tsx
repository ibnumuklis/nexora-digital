import Link from 'next/link';

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <rect width="40" height="40" rx="11" fill="#C5F36B" />
      <path d="M11 29V11h3.2l11.6 12.4V11H29v18h-3.2L14.2 16.6V29H11Z" fill="#102C25" />
    </svg>
  );
}

export function Logo({ tone = 'light', sub = 'TECHNOLOGY & PRODUCT STUDIO' }: { tone?: 'light' | 'dark'; sub?: string }) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="NEXORA DIGITAL home">
      <LogoMark />
      <span className="leading-tight">
        <b className={`block font-display text-[15px] tracking-[.14em] ${tone === 'light' ? 'text-white' : 'text-fg'}`}>NEXORA DIGITAL</b>
        <small className={`hidden whitespace-nowrap text-[9px] tracking-[.22em] sm:block ${tone === 'light' ? 'text-white/65' : 'text-muted'}`}>{sub}</small>
      </span>
    </Link>
  );
}
