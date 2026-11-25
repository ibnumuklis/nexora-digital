'use client';
import { waLink } from '@/lib/whatsapp';
import { track } from './consent';
import { useI18n } from './i18n';

export function WhatsAppIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.04 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.21-3.58.94.96-3.49-.23-.36a9.44 9.44 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.91.99 6.7 2.78a9.4 9.4 0 0 1 2.77 6.7c0 5.22-4.25 9.46-9.47 9.46zm8.05-17.52A11.3 11.3 0 0 0 12.04.65C5.77.65.66 5.75.66 12.03c0 2 .52 3.96 1.52 5.69L.57 23.6l6.02-1.58a11.36 11.36 0 0 0 5.44 1.39h.01c6.27 0 11.38-5.1 11.38-11.38 0-3.04-1.18-5.9-3.33-8.05z" />
    </svg>
  );
}

type Props = { text?: string; productSlug?: string; label: string; className?: string; children?: React.ReactNode };

/** External WhatsApp link with a pre-filled message; records a consent-gated CTA event. */
export function WhatsAppLink({ text, productSlug, label, className = '', children }: Props) {
  return (
    <a href={waLink(text)} target="_blank" rel="noopener noreferrer" className={className}
      onClick={() => track('contact_cta_click', { productSlug, metadata: { channel: 'whatsapp', label } })}>
      {children}
    </a>
  );
}

export function WhatsAppButton({ text, productSlug, label, variant = 'solid', className = '' }: Omit<Props, 'children'> & { variant?: 'solid' | 'outline-light' | 'outline' }) {
  const { t } = useI18n();
  const styles = {
    solid: 'bg-[#25D366] text-[#073B1E] hover:bg-[#20bd5a]',
    'outline-light': 'border border-white/25 text-white hover:border-[#25D366] hover:text-[#25D366]',
    outline: 'border border-line hover:border-[#1da851] hover:text-[#1da851]',
  }[variant];
  return (
    <WhatsAppLink text={text} productSlug={productSlug} label={label} className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition ${styles} ${className}`}>
      <WhatsAppIcon size={17} /> {t.common.whatsapp}
    </WhatsAppLink>
  );
}

/** Floating WhatsApp button (bottom-right) on public pages. */
export function WhatsAppFloat() {
  const { t } = useI18n();
  return (
    <WhatsAppLink text={t.wa.general} label="floating" className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,.7)] transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime motion-reduce:hover:scale-100 sm:bottom-7 sm:right-7">
      <WhatsAppIcon size={28} />
      <span className="sr-only">{t.wa.floating}</span>
    </WhatsAppLink>
  );
}
