'use client';
import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { Alert, Button, Field, inputCls } from '@/components/ui';
import { INQUIRY_TYPES, inquirySchema, zodFieldErrors } from '@/lib/validation/forms';
import { track } from './consent';
import { useI18n } from './i18n';
import { WhatsAppButton } from './whatsapp';

type Props = {
  defaultType?: (typeof INQUIRY_TYPES)[number];
  source?: 'contact' | 'product' | 'demo' | 'quote' | 'consultation' | 'partner' | 'custom_development';
  productSlug?: string;
  products?: { slug: string; name: string }[];
  interest?: string;
  allowTypeChange?: boolean;
};

export function InquiryForm({ defaultType = 'general', source, productSlug, products = [], interest, allowTypeChange = false }: Props) {
  const { t } = useI18n();
  const F = t.form;
  /** Field errors are shown in the visitor's language regardless of the (English) validator/server text. */
  const localize = (errs: Record<string, string>) => Object.fromEntries(Object.keys(errs).map((k) => [k, F.errors[k] ?? F.errors.form]));
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
      setErrors(localize(zodFieldErrors(parsed.error)));
      setState('error');
      setMessage(F.checkFields);
      return;
    }
    if (!navigator.onLine) { setState('offline'); return; }
    setErrors({});
    setState('sending');
    try {
      const res = await fetch('/api/inquiries', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(parsed.data) });
      const body = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string> };
      if (!res.ok) {
        setErrors(localize(body.fieldErrors ?? {}));
        setMessage(res.status === 429 ? F.rateLimited : body.fieldErrors && Object.keys(body.fieldErrors).length ? F.checkFields : F.failed);
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
        <h3 className="mt-4 text-xl font-semibold">{F.sentTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{F.sentBody}</p>
        <p className="mt-5 text-xs font-semibold text-muted">{F.sentWa}</p>
        <WhatsAppButton text={t.wa.general} productSlug={productSlug} label="form_sent" className="mt-3" />
      </div>
    );
  }

  const err = (k: string) => errors[k];
  const aria = (k: string) => ({ 'aria-invalid': !!err(k) || undefined, 'aria-describedby': err(k) ? `${k}-error` : undefined });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      {state === 'error' && message && <Alert tone="error">{message}</Alert>}
      {state === 'offline' && <Alert tone="warning" title={F.offlineTitle}>{F.offlineBody}</Alert>}
      {allowTypeChange && (
        <Field label={F.typeLabel} htmlFor="inquiry_type">
          <select id="inquiry_type" value={type} onChange={(e) => setType(e.target.value as typeof type)} className={inputCls}>
            {INQUIRY_TYPES.map((x) => <option key={x} value={x}>{F.types[x]}</option>)}
          </select>
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={F.name} htmlFor="full_name" required error={err('full_name')}><input id="full_name" name="full_name" autoComplete="name" required maxLength={120} className={inputCls} {...aria('full_name')} /></Field>
        <Field label={F.email} htmlFor="email" required error={err('email')}><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className={inputCls} {...aria('email')} /></Field>
        <Field label={F.phone} htmlFor="phone" error={err('phone')} hint={F.phoneHint}><input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={40} placeholder={F.phonePlaceholder} className={inputCls} {...aria('phone')} /></Field>
        <Field label={F.company} htmlFor="company" error={err('company')} hint={F.optional}><input id="company" name="company" autoComplete="organization" maxLength={160} className={inputCls} /></Field>
        <Field label={F.industry} htmlFor="industry" hint={F.optional}><input id="industry" name="industry" maxLength={80} className={inputCls} /></Field>
        {products.length > 0 && !productSlug ? (
          <Field label={F.product} htmlFor="product_slug" hint={F.optional}>
            <select id="product_slug" name="product_slug" className={inputCls} defaultValue="">
              <option value="">{F.notSure}</option>
              {products.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
          </Field>
        ) : <input type="hidden" name="product_slug" value={productSlug ?? ''} />}
      </div>
      {showCommercial && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={F.budget} htmlFor="budget_range" hint={F.optional}><select id="budget_range" name="budget_range" className={inputCls} defaultValue=""><option value="">{F.budgetNone}</option>{F.budgets.map((b) => <option key={b}>{b}</option>)}</select></Field>
          <Field label={F.timeline} htmlFor="timeline" hint={F.optional}><select id="timeline" name="timeline" className={inputCls} defaultValue=""><option value="">{F.timelineFlexible}</option>{F.timelines.map((x) => <option key={x}>{x}</option>)}</select></Field>
        </div>
      )}
      <Field label={F.message} htmlFor="message" required error={err('message')}>
        <textarea id="message" name="message" rows={5} required minLength={10} maxLength={5000} className={inputCls} placeholder={F.messagePlaceholder} {...aria('message')} />
      </Field>
      <div className="hidden" aria-hidden><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="flex gap-3 text-sm leading-6">
        <input type="checkbox" name="privacy_consent" className="mt-1 h-4 w-4 accent-emerald" aria-invalid={!!err('privacy_consent') || undefined} />
        <span>{F.consent1} <Link href="/privacy" className="font-semibold text-accent underline underline-offset-4">{F.consentLink}</Link>. <span className="text-red-600">*</span></span>
      </label>
      {err('privacy_consent') && <p className="-mt-2 text-xs font-medium text-red-600">{err('privacy_consent')}</p>}
      <label className="flex gap-3 text-sm leading-6 text-muted">
        <input type="checkbox" name="marketing_consent" className="mt-1 h-4 w-4 accent-emerald" />
        <span>{F.consent2}</span>
      </label>
      <Button type="submit" disabled={state === 'sending'} className="mt-2 w-full sm:w-auto">
        {state === 'sending' ? <><Loader2 className="animate-spin" size={16} aria-hidden /> {F.sending}</> : <><Send size={16} aria-hidden /> {F.send}</>}
      </Button>
    </form>
  );
}
