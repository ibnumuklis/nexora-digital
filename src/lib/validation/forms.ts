import { z } from 'zod';

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));

export const quotedAmountSchema = z.string().trim()
  .refine((value) => value === '' || /^\d{1,12}(?:\.\d{1,2})?$/.test(value), 'Enter an amount with up to two decimal places, without currency symbols or separators.')
  .optional()
  .transform((value) => value ? Number(value) : null);

export const INQUIRY_TYPES = ['general', 'quotation', 'consultation', 'custom_development', 'license', 'partnership'] as const;
export const INQUIRY_SOURCES = ['contact', 'product', 'demo', 'quote', 'consultation', 'partner', 'custom_development'] as const;

export const INQUIRY_TYPE_LABELS: Record<(typeof INQUIRY_TYPES)[number], string> = {
  general: 'General question',
  quotation: 'Request a quotation',
  consultation: 'Book a consultation',
  custom_development: 'Custom development project',
  license: 'Software license',
  partnership: 'Partner / reseller / white-label',
};

/** Public inquiry form (contact, quote, consultation, custom development, partner). */
export const inquirySchema = z.object({
  full_name: trimmed(120).min(2, 'Please enter your name.'),
  email: z.string().trim().toLowerCase().max(254).email('Please enter a valid email address.'),
  phone: optionalText(40).refine((v) => !v || /^[0-9+()\-\s.]{6,40}$/.test(v), 'Please enter a valid phone number.'),
  company: optionalText(160),
  industry: optionalText(80),
  product_slug: optionalText(100).refine((v) => !v || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v), 'Invalid product.'),
  inquiry_type: z.enum(INQUIRY_TYPES).default('general'),
  source: z.enum(INQUIRY_SOURCES).default('contact'),
  message: trimmed(5000).min(10, 'Please describe your need (at least 10 characters).'),
  budget_range: optionalText(80),
  timeline: optionalText(80),
  interest_label: optionalText(120),
  privacy_consent: z.literal(true, { message: 'Please accept the privacy policy so we can respond.' }),
  marketing_consent: z.boolean().default(false),
  website: z.string().max(200).optional(), // honeypot – must stay empty
  utm: z.record(z.string().max(40), z.string().max(120)).optional(),
});
export type InquiryInput = z.infer<typeof inquirySchema>;

/** Map DB function errors to user-facing messages without leaking internals. */
export const INQUIRY_ERRORS: Record<string, { status: number; message: string }> = {
  consent_required: { status: 400, message: 'Please accept the privacy policy.' },
  invalid_name: { status: 400, message: 'Please enter your name.' },
  invalid_email: { status: 400, message: 'Please enter a valid email address.' },
  invalid_message: { status: 400, message: 'Please describe your need (10–5000 characters).' },
  invalid_phone: { status: 400, message: 'Please enter a valid phone number.' },
  invalid_input: { status: 400, message: 'Some fields are invalid.' },
  rate_limited: { status: 429, message: 'Too many submissions. Please try again later.' },
};

export const slugSchema = z.string().trim().toLowerCase().min(2).max(100).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens.');

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    out[key] ??= issue.message;
  }
  return out;
}
