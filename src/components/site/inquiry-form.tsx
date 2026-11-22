'use client';
import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { Alert, Button, Field, inputCls } from '@/components/ui';
import { INQUIRY_TYPE_LABELS, INQUIRY_TYPES, inquirySchema, zodFieldErrors } from '@/lib/validation/forms';
import { track } from './consent';

type Props = {
  defaultType?: (typeof INQUIRY_TYPES)[number];
  source?: 'contact' | 'product' | 'demo' | 'quote' | 'consultation' | 'partner' | 'custom_development';
  productSlug?: string;
  products?: { slug: string; name: string }[];
  interest?: string;
  allowTypeChange?: boolean;
};

export function InquiryForm({ defaultType = 'general', source, productSlug, products = [], interest, allowTypeChange = false }: Props) {
  const [type, setType] = useState(defaultType);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error' | 'offline'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const showCommercial = type === 'quotation' || type === 'custom_development' || type === 'license';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = {
      full_name: String(fd.get('full_name') ?? ''), email: String(fd.get('email') ?? ''), phone: String(fd.get('phone') ?? ''),
      company: String(fd.get('company') ?? ''), industry: String(fd.get('industry') ?? ''),
      product_slug: String(fd.get('product_slug') ?? productSlug ?? ''), inquiry_type: type,
      source: source ?? (type === 'quotation' ? 'quote' : type === 'consultation' ? 'consultation' : type === 'partnership' ? 'partner' : type === 'custom_development' ? 'custom_development' : 'contact'),
      message: String(fd.get('message') ?? ''), budget_range: String(fd.get('budget_range') ?? ''), timeline: String(fd.get('timeline') ?? ''),
      interest_label: interest, privacy_consent: fd.get('privacy_consent') === 'on' ? (true as const) : (false as unknown as true),
      marketing_consent: fd.get('marketing_consent') === 'on', website: String(fd.get('website') ?? ''),
    };
    const parsed = inquirySchema.safeParse(raw);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      setState('error');
      setMessage('Please check the highlighted fields.');
      return;
    }
    if (!navigator.onLine) { setState('offline'); return; }
    setErrors({});
    setState('sending');
    try {
      const res = await fetch('/api/inquiries', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(parsed.data) });
      const body = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string> };
      if (!res.ok) {
        setErrors(body.fieldErrors ?? {});
        setMessage(body.error ?? 'We could not send your message. Please try again.');
        setState('error');
        return;
      }
      track('inquiry_submitted', { productSlug: parsed.data.product_slug, metadata: { type } });
      setState('sent');
    } catch {
      setState('offline');
    }
  }

  if (state === 'sent') {
    return (
      <div className="rounded-3xl border border-emerald/30 bg-emerald-50 p-8 text-center dark:bg-emerald/15" role="status">
        <CheckCircle2 className="mx-auto text-emerald-600 dark:text-lime" size={40} aria-hidden />
        <h3 className="mt-4 text-xl font-semibold">Thank you — we received your message</h3>
        <p className="mt-2 text-sm leading-6 text-muted">Our team will review it and reply by email. We never share your details with third parties.</p>
      </div>
    );
  }

  const err = (k: string) => errors[k];
  const aria = (k: string) => ({ 'aria-invalid': !!err(k) || undefined, 'aria-describedby': err(k) ? `${k}-error` : undefined });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      {state === 'error' && message && <Alert tone="error">{message}</Alert>}
      {state === 'offline' && <Alert tone="warning" title="You appear to be offline">Check your connection and submit again — your text is still in the form.</Alert>}
      {allowTypeChange && (
        <Field label="What can we help with?" htmlFor="inquiry_type">
          <select id="inquiry_type" value={type} onChange={(e) => setType(e.target.value as typeof type)} className={inputCls}>
            {INQUIRY_TYPES.map((t) => <option key={t} value={t}>{INQUIRY_TYPE_LABELS[t]}</option>)}
          </select>
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="full_name" required error={err('full_name')}><input id="full_name" name="full_name" autoComplete="name" required maxLength={120} className={inputCls} {...aria('full_name')} /></Field>
        <Field label="Work email" htmlFor="email" required error={err('email')}><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className={inputCls} {...aria('email')} /></Field>
        <Field label="Phone / WhatsApp" htmlFor="phone" error={err('phone')} hint="Optional"><input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={40} className={inputCls} {...aria('phone')} /></Field>
        <Field label="Company / organisation" htmlFor="company" error={err('company')} hint="Optional"><input id="company" name="company" autoComplete="organization" maxLength={160} className={inputCls} /></Field>
        <Field label="Industry" htmlFor="industry" hint="Optional"><input id="industry" name="industry" maxLength={80} className={inputCls} /></Field>
        {products.length > 0 && !productSlug ? (
          <Field label="Product of interest" htmlFor="product_slug" hint="Optional">
            <select id="product_slug" name="product_slug" className={inputCls} defaultValue="">
              <option value="">Not sure yet</option>
              {products.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
          </Field>
        ) : <input type="hidden" name="product_slug" value={productSlug ?? ''} />}
      </div>
      {showCommercial && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Budget range" htmlFor="budget_range" hint="Optional"><select id="budget_range" name="budget_range" className={inputCls} defaultValue=""><option value="">Prefer not to say</option><option>Below IDR 25 million</option><option>IDR 25–100 million</option><option>IDR 100–500 million</option><option>Above IDR 500 million</option></select></Field>
          <Field label="Timeline" htmlFor="timeline" hint="Optional"><select id="timeline" name="timeline" className={inputCls} defaultValue=""><option value="">Flexible</option><option>Within 1 month</option><option>1–3 months</option><option>3–6 months</option><option>More than 6 months</option></select></Field>
        </div>
      )}
      <Field label="How can we help?" htmlFor="message" required error={err('message')}>
        <textarea id="message" name="message" rows={5} required minLength={10} maxLength={5000} className={inputCls} placeholder="Describe your process, goals or the problem to solve." {...aria('message')} />
      </Field>
      <div className="hidden" aria-hidden><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="flex gap-3 text-sm leading-6">
        <input type="checkbox" name="privacy_consent" className="mt-1 h-4 w-4 accent-emerald" aria-invalid={!!err('privacy_consent') || undefined} />
        <span>I agree that NEXORA DIGITAL may store and use these details to respond to my request, as described in the <Link href="/privacy" className="font-semibold text-accent underline underline-offset-4">privacy policy</Link>. <span className="text-red-600">*</span></span>
      </label>
      {err('privacy_consent') && <p className="-mt-2 text-xs font-medium text-red-600">{err('privacy_consent')}</p>}
      <label className="flex gap-3 text-sm leading-6 text-muted">
        <input type="checkbox" name="marketing_consent" className="mt-1 h-4 w-4 accent-emerald" />
        <span>Optional: send me occasional product updates. I can unsubscribe at any time.</span>
      </label>
      <Button type="submit" disabled={state === 'sending'} className="mt-2 w-full sm:w-auto">
        {state === 'sending' ? <><Loader2 className="animate-spin" size={16} aria-hidden /> Sending…</> : <><Send size={16} aria-hidden /> Send message</>}
      </Button>
    </form>
  );
}
