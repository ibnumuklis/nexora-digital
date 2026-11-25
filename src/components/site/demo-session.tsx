'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Clock, Loader2, LockKeyhole, Play, RefreshCw, ShieldCheck, Square, WifiOff } from 'lucide-react';
import { Alert, Button } from '@/components/ui';
import { fmt } from '@/lib/i18n/config';
import { useI18n } from './i18n';
import { WhatsAppButton } from './whatsapp';

type Session = {
  session_id: string; session_ref: string; product_name: string; expires_at: string; duration_seconds: number; idle_timeout_seconds: number;
  warning_seconds: number[]; watermark: string; mode: 'sandbox' | 'iframe'; iframe_url: string | null; disclaimer: string; started_at: string;
};
type View = { module: { key: string; title: string }; kpis: { label: string; value: string }[]; rows: { ref: string; name: string; status: string; updated: string; value: string }[]; note: string };
type Phase = 'ready' | 'starting' | 'active' | 'expired' | 'ended' | 'error';
type ErrCode = 'unavailable' | 'rate_limited' | 'active_session' | 'capacity' | 'network' | 'not_configured' | 'invalid' | 'offline';

const HEARTBEAT_MS = 10_000;

/** Countdown uses performance.now() (monotonic) re-anchored on every server response, so changing the device clock has no effect. */
export function DemoSession({ productSlug, productName }: { productSlug: string; productName: string }) {
  const { t } = useI18n();
  const T = t.demo;
  const [phase, setPhase] = useState<Phase>('ready');
  const [session, setSession] = useState<Session | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [idleRemaining, setIdleRemaining] = useState(0);
  const [endReason, setEndReason] = useState<string | null>(null);
  const [error, setError] = useState<{ code: ErrCode; message: string } | null>(null);
  const [modules, setModules] = useState<{ key: string; title: string }[]>([]);
  const [view, setView] = useState<View | null>(null);
  const [loadingView, setLoadingView] = useState(false);
  const [offline, setOffline] = useState(false);
  const anchor = useRef<{ at: number; remaining: number; idle: number }>({ at: 0, remaining: 0, idle: 0 });
  const activity = useRef(false);

  const reanchor = (rem: number, idle: number) => {
    anchor.current = { at: performance.now(), remaining: rem, idle };
    setRemaining(rem);
    setIdleRemaining(idle);
  };

  const finish = useCallback((reason: string | null, status: 'expired' | 'ended' = 'expired') => {
    setEndReason(reason);
    setPhase(status);
    setView(null);
  }, []);

  const loadModule = useCallback(async (key: string) => {
    setLoadingView(true);
    try {
      const res = await fetch(`/api/demo/sandbox?product=${productSlug}&module=${key}`, { cache: 'no-store' });
      const body = await res.json();
      if (res.status === 410 || body.status === 'expired' || body.status === 'invalid') return finish(body.reason ?? null);
      if (!res.ok) throw new Error('sandbox');
      setModules(body.modules);
      setView(body.view);
      reanchor(body.remaining_seconds, body.idle_remaining_seconds);
    } catch {
      setOffline(!navigator.onLine);
    } finally {
      setLoadingView(false);
    }
  }, [productSlug, finish]);

  async function start() {
    setPhase('starting');
    setError(null);
    try {
      const res = await fetch('/api/demo/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slug: productSlug }) });
      const body = await res.json();
      if (!res.ok) {
        setError({ code: body.code ?? 'network', message: T.errorStart });
        setPhase('error');
        return;
      }
      const s: Session = body.session;
      setSession(s);
      reanchor(s.duration_seconds, s.idle_timeout_seconds);
      setPhase('active');
      if (s.mode === 'sandbox') void loadModule('m0');
    } catch {
      setError({ code: navigator.onLine ? 'network' : 'offline', message: T.errorReach });
      setPhase('error');
    }
  }

  async function end() {
    await fetch('/api/demo/end', { method: 'POST' }).catch(() => undefined);
    finish('user', 'ended');
  }

  // Local display tick.
  useEffect(() => {
    if (phase !== 'active') return;
    const t = setInterval(() => {
      const elapsed = Math.floor((performance.now() - anchor.current.at) / 1000);
      setRemaining(Math.max(0, anchor.current.remaining - elapsed));
      setIdleRemaining(Math.max(0, anchor.current.idle - elapsed));
    }, 250);
    return () => clearInterval(t);
  }, [phase]);

  // Activity tracking (any interaction inside the page counts). Embedded demos report their own
  // activity via postMessage — accepted only from the demo's exact origin and only as a boolean signal.
  useEffect(() => {
    if (phase !== 'active') return;
    const mark = () => { activity.current = true; };
    const evs = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    evs.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    let origin: string | null = null;
    try { origin = session?.mode === 'iframe' && session.iframe_url ? new URL(session.iframe_url).origin : null; } catch { origin = null; }
    const onMsg = (e: MessageEvent) => {
      if (origin && e.origin === origin && e.data && typeof e.data === 'object' && (e.data as { type?: unknown }).type === 'nexora-demo-activity') mark();
    };
    window.addEventListener('message', onMsg);
    return () => { evs.forEach((e) => window.removeEventListener(e, mark)); window.removeEventListener('message', onMsg); };
  }, [phase, session]);

  // Server heartbeat: the server decides expiry.
  useEffect(() => {
    if (phase !== 'active') return;
    let stopped = false;
    const beat = async () => {
      const act = activity.current;
      activity.current = false;
      try {
        const res = await fetch('/api/demo/heartbeat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ activity: act }), cache: 'no-store' });
        const body = await res.json();
        if (stopped) return;
        setOffline(false);
        if (body.status === 'active') reanchor(body.remaining_seconds, body.idle_remaining_seconds);
        else if (res.status === 410 || res.status === 401) finish(body.reason ?? null, body.status === 'ended' ? 'ended' : 'expired');
      } catch {
        if (!stopped) setOffline(true);
      }
    };
    const t = setInterval(beat, HEARTBEAT_MS);
    const onVis = () => { if (document.visibilityState === 'visible') void beat(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { stopped = true; clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, [phase, finish]);

  // When the local countdown hits 0, confirm with the server immediately.
  useEffect(() => {
    if (phase === 'active' && (remaining === 0 || idleRemaining === 0)) {
      void fetch('/api/demo/heartbeat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ activity: false }) })
        .then((r) => r.json())
        .then((b) => { if (b.status !== 'active') finish(b.reason ?? (idleRemaining === 0 ? 'idle' : 'duration')); else reanchor(b.remaining_seconds, b.idle_remaining_seconds); })
        .catch(() => setOffline(true));
    }
  }, [phase, remaining, idleRemaining, finish]);

  const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const warning = session?.warning_seconds ?? [60, 30];
  const idleWarn = phase === 'active' && idleRemaining <= warning[0];
  const timeWarn = phase === 'active' && remaining <= warning[0];
  const stamp = session ? new Date(session.started_at).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : '';

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-forest px-6 py-4 text-white">
        <div>
          <p className="text-[9px] uppercase tracking-[.2em] text-lime">{T.protected}</p>
          <h1 className="mt-1 text-lg font-semibold">{productName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 text-xs text-white/70 sm:inline-flex"><ShieldCheck size={15} className="text-lime" aria-hidden /> {T.synthetic}</span>
          <span role="timer" aria-live="off" aria-label={T.timeLeft} className={`rounded-full px-3 py-2 font-mono text-sm ${timeWarn ? 'bg-amber-300 text-forest' : 'bg-white/10'}`}>
            <Clock size={14} className="mr-2 inline" aria-hidden />{phase === 'active' ? clock(remaining) : '--:--'}
          </span>
          {phase === 'active' && <Button variant="lime" onClick={end} className="min-h-[36px] px-4 py-1.5 text-xs"><Square size={13} aria-hidden /> {T.end}</Button>}
        </div>
      </div>

      <div className={`relative min-h-[460px] overflow-hidden bg-bg ${phase === 'active' && session?.mode === 'iframe' ? 'p-2 md:p-3' : 'p-6 md:p-10'}`}>
        {phase === 'active' && session && (
          <>
            <div className="pointer-events-none absolute inset-0 z-10 flex select-none flex-wrap content-center justify-center gap-24 overflow-hidden opacity-[.06]" aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => <span key={i} className="rotate-[-25deg] whitespace-nowrap text-3xl font-black tracking-widest text-fg">{session.watermark} · {session.session_ref}</span>)}
            </div>
            <div className="pointer-events-none absolute bottom-3 right-4 z-10 rounded bg-surface/90 px-3 py-1.5 font-mono text-[10px] font-bold tracking-[.12em] text-muted" aria-hidden>
              DEMO VERSION · NEXORA DIGITAL · REF {session.session_ref} · {stamp}
            </div>
          </>
        )}

        <div aria-live="polite" className="sr-only">
          {idleWarn && fmt(T.srIdle, { s: idleRemaining })}
          {timeWarn && !idleWarn && fmt(T.srTime, { s: remaining })}
        </div>

        {phase === 'ready' || phase === 'starting' ? (
          <div className="relative mx-auto flex min-h-[400px] max-w-xl flex-col items-center justify-center text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald/20 dark:text-lime"><LockKeyhole size={28} aria-hidden /></span>
            <h2 className="mt-6 text-2xl font-semibold">{T.startTitle}</h2>
            <ul className="mt-4 grid gap-1 text-sm leading-6 text-muted">
              {T.startPoints.map((x) => <li key={x}>• {x}</li>)}
            </ul>
            <Button onClick={start} disabled={phase === 'starting'} className="mt-7">
              {phase === 'starting' ? <><Loader2 className="animate-spin" size={16} aria-hidden /> {T.starting}</> : <><Play size={16} aria-hidden /> {T.start}</>}
            </Button>
            <p className="mt-4 text-xs text-muted">{T.accept} <Link href="/demo-disclaimer" className="underline">{T.acceptLink}</Link>.</p>
          </div>
        ) : phase === 'error' && error ? (
          <div className="relative mx-auto flex min-h-[400px] max-w-xl flex-col items-center justify-center text-center">
            {error.code === 'offline' ? <WifiOff size={36} className="text-amber-600" aria-hidden /> : <AlertTriangle size={36} className="text-amber-600" aria-hidden />}
            <h2 className="mt-5 text-2xl font-semibold">{T.errors[error.code] ?? T.errors.default}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{error.message}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {error.code !== 'unavailable' && <Button variant="outline" onClick={start}><RefreshCw size={15} aria-hidden /> {T.retry}</Button>}
              <Link href={`/contact?type=consultation&product=${productSlug}`} className="inline-flex min-h-[44px] items-center rounded-full bg-forest px-5 text-sm font-semibold text-white dark:bg-lime dark:text-forest">{T.guided}</Link>
            </div>
          </div>
        ) : phase === 'expired' || phase === 'ended' ? (
          <div className="relative mx-auto flex min-h-[400px] max-w-xl flex-col items-center justify-center text-center">
            <Clock size={38} className="text-accent" aria-hidden />
            <h2 className="mt-5 text-2xl font-semibold">{phase === 'ended' ? T.ended : endReason === 'idle' ? T.idle : endReason === 'revoked' ? T.revoked : T.timeUp}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{fmt(T.thanks, { product: productName })}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <WhatsAppButton text={fmt(t.wa.demoEnd, { product: productName })} productSlug={productSlug} label="demo_end" />
              <Link href={`/contact?type=quotation&product=${productSlug}`} className="inline-flex min-h-[44px] items-center rounded-full border border-line px-5 text-sm font-semibold">{t.detail.quote}</Link>
            </div>
            <Button variant="ghost" onClick={() => { setPhase('ready'); setSession(null); }} className="mt-4 text-xs">{T.newSession}</Button>
          </div>
        ) : session?.mode === 'iframe' && session.iframe_url ? (
          <div className="relative">
            {idleWarn && <Alert tone="warning" className="mb-4">{fmt(T.stillThere, { s: idleRemaining })}</Alert>}
            <iframe src={session.iframe_url} title={fmt(T.iframeTitle, { product: productName })} className="h-[78vh] min-h-[560px] w-full rounded-2xl border border-line bg-surface" sandbox="allow-scripts allow-same-origin allow-forms allow-modals" referrerPolicy="no-referrer" allow="clipboard-write" />
          </div>
        ) : (
          <div className="relative">
            {offline && <Alert tone="warning" className="mb-4" title={T.lostTitle}>{T.lostBody}</Alert>}
            {idleWarn && <Alert tone="warning" className="mb-4">{fmt(T.stillThere, { s: idleRemaining })}</Alert>}
            {timeWarn && !idleWarn && <Alert tone="info" className="mb-4">{remaining <= warning[1] ? fmt(T.lastSeconds, { s: remaining }) : T.oneMinute}</Alert>}
            <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
              <nav aria-label={T.modules} className="grid content-start gap-1">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-muted">{T.modules}</p>
                {modules.map((m) => (
                  <button key={m.key} onClick={() => loadModule(m.key)} aria-current={view?.module.key === m.key ? 'page' : undefined} className={`rounded-xl px-4 py-3 text-left text-sm transition ${view?.module.key === m.key ? 'bg-forest text-white dark:bg-lime dark:text-forest' : 'hover:bg-surface-2'}`}>{m.title}</button>
                ))}
              </nav>
              <section aria-busy={loadingView} className="min-w-0">
                {!view ? (
                  <div className="grid gap-3" aria-label={T.loading}><div className="skeleton h-8 w-1/3" /><div className="skeleton h-24" /><div className="skeleton h-48" /></div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">{view.module.title}</h2><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:bg-emerald/20 dark:text-lime">{T.readOnly}</span></div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">{view.kpis.map((k) => <div key={k.label} className="card p-4"><p className="text-xs text-muted">{k.label}</p><p className="mt-2 text-2xl font-semibold">{k.value}</p></div>)}</div>
                    <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface">
                      <table className="w-full min-w-[520px] text-left text-sm">
                        <caption className="sr-only">{T.records}</caption>
                        <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted"><tr>{T.cols.map((c, i) => <th key={c} className={`px-4 py-3 ${i === 4 ? 'text-right' : ''}`}>{c}</th>)}</tr></thead>
                        <tbody>{view.rows.map((r) => <tr key={r.ref} className="border-t border-line"><td className="px-4 py-3 font-mono text-xs">{r.ref}</td><td className="px-4 py-3">{r.name}</td><td className="px-4 py-3">{r.status}</td><td className="px-4 py-3">{r.updated}</td><td className="px-4 py-3 text-right">{r.value}</td></tr>)}</tbody>
                      </table>
                    </div>
                    <p className="mt-3 text-xs text-muted">{view.note} {T.disabled}</p>
                  </>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4 text-xs text-muted">
        <span>{T.footer}</span>
        <span>{fmt(T.inactivity, { s: session ? session.idle_timeout_seconds : 90 })}</span>
      </div>
    </div>
  );
}
