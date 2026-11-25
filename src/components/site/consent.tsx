'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useI18n } from './i18n';

/**
 * Consent-aware first-party analytics. Nothing is sent until the visitor opts in.
 * Consent is stored in a first-party cookie `nx_consent` (essential | analytics) for 180 days.
 * The analytics session id is random, per browser tab session, and not linked to any identity.
 */
type Consent = 'essential' | 'analytics' | null;
const ConsentCtx = createContext<{ consent: Consent; setConsent: (c: Exclude<Consent, null>) => void; openSettings: () => void }>({ consent: null, setConsent: () => {}, openSettings: () => {} });

function readConsent(): Consent {
  const m = document.cookie.match(/(?:^|; )nx_consent=(essential|analytics)/);
  return (m?.[1] as Consent) ?? null;
}

function sessionId(): string {
  try {
    let id = sessionStorage.getItem('nx_sid');
    if (!id) {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      sessionStorage.setItem('nx_sid', id);
    }
    return id;
  } catch {
    return '';
  }
}

export type TrackEvent = 'page_view' | 'product_view' | 'search' | 'cta_clicked' | 'demo_cta_click' | 'contact_cta_click' | 'inquiry_submitted' | 'content_downloaded';

export function track(event: TrackEvent, data: { productSlug?: string; metadata?: Record<string, string | number | boolean> } = {}) {
  if (typeof document === 'undefined' || readConsent() !== 'analytics') return;
  const body = JSON.stringify({ event, path: location.pathname, productSlug: data.productSlug, sessionHash: sessionId(), source: document.referrer ? new URL(document.referrer).hostname.slice(0, 80) : 'direct', metadata: data.metadata ?? {} });
  try {
    void fetch('/api/events', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true, credentials: 'same-origin' }).catch(() => undefined);
  } catch {}
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setState] = useState<Consent>(null);
  const [ready, setReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const path = usePathname();
  const last = useRef<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    setState(readConsent());
    setReady(true);
  }, []);

  const setConsent = useCallback((c: Exclude<Consent, null>) => {
    document.cookie = `nx_consent=${c}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    setState(c);
    setShowSettings(false);
  }, []);

  useEffect(() => {
    if (consent === 'analytics' && last.current !== path) {
      last.current = path;
      track('page_view');
    }
  }, [consent, path]);

  return (
    <ConsentCtx.Provider value={{ consent, setConsent, openSettings: () => setShowSettings(true) }}>
      {children}
      {ready && (consent === null || showSettings) && (
        <div role="dialog" aria-modal="false" aria-labelledby="consent-title" className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-2xl rounded-3xl border border-line bg-surface p-5 shadow-soft sm:inset-x-6 sm:bottom-6 sm:p-6">
          <h2 id="consent-title" className="text-base font-semibold">{t.consent.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {t.consent.body}{' '}
            <Link href="/cookies" className="font-semibold text-accent underline underline-offset-4">{t.consent.link}</Link>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => setConsent('analytics')} className="min-h-[44px] rounded-full bg-forest px-5 text-sm font-semibold text-white hover:bg-emerald-600 dark:bg-lime dark:text-forest">{t.consent.allow}</button>
            <button onClick={() => setConsent('essential')} className="min-h-[44px] rounded-full border border-line px-5 text-sm font-semibold hover:border-accent">{t.consent.essential}</button>
          </div>
        </div>
      )}
    </ConsentCtx.Provider>
  );
}

export function useConsent() {
  return useContext(ConsentCtx);
}

export function CookieSettingsLink() {
  const { openSettings } = useConsent();
  const { t } = useI18n();
  return <button type="button" onClick={openSettings} className="hover:text-lime">{t.footer.cookieSettings}</button>;
}

/** Fire a one-off event when mounted (e.g. product_view). */
export function TrackOnMount({ event, productSlug }: { event: TrackEvent; productSlug?: string }) {
  const { consent } = useConsent();
  const sent = useRef(false);
  useEffect(() => {
    if (consent === 'analytics' && !sent.current) {
      sent.current = true;
      track(event, { productSlug });
    }
  }, [consent, event, productSlug]);
  return null;
}

/** Link wrapper that records a CTA click (only with consent). */
export function TrackedLink({ event, productSlug, label, ...props }: React.ComponentProps<typeof Link> & { event: TrackEvent; productSlug?: string; label?: string }) {
  return <Link {...props} onClick={(e) => { track(event, { productSlug, metadata: label ? { label } : undefined }); props.onClick?.(e); }} />;
}
