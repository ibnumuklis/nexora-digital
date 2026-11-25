import { COMPANY } from '@/lib/company';

/** wa.me link with a pre-filled message (text is URL-encoded; no personal data is added). */
export function waLink(text?: string): string {
  return text ? `${COMPANY.whatsappUrl}?text=${encodeURIComponent(text.slice(0, 500))}` : COMPANY.whatsappUrl;
}
