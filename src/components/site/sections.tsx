import Link from 'next/link';
import { Clock, Code2, Handshake, KeyRound, LifeBuoy, Repeat, ShieldCheck, Sparkles, TimerReset } from 'lucide-react';
import { getI18n } from '@/lib/i18n/server';
import { WhatsAppButton } from './whatsapp';

const ENGAGEMENT_ICONS = { saas: Repeat, license: KeyRound, custom: Code2, maintenance: LifeBuoy, whitelabel: Handshake } as const;
export const PACKAGE_TIER_KEYS = ['starter', 'professional', 'enterprise', 'custom'] as const;
export const TIER_NAMES: Record<(typeof PACKAGE_TIER_KEYS)[number], string> = { starter: 'Starter', professional: 'Professional', enterprise: 'Enterprise', custom: 'Custom' };

export async function EngagementGrid() {
  const { t } = await getI18n();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {t.sections.engagement.map((m) => {
        const Icon = ENGAGEMENT_ICONS[m.key as keyof typeof ENGAGEMENT_ICONS] ?? Code2;
        return (
          <div key={m.key} className="card p-7">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald/20 dark:text-lime"><Icon size={22} aria-hidden /></span>
            <h3 className="mt-6 text-lg font-semibold">{m.title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted">{m.desc}</p>
          </div>
        );
      })}
    </div>
  );
}

export async function DemoExplainer() {
  const { t } = await getI18n();
  const icons = [Sparkles, Clock, ShieldCheck, TimerReset];
  return (
    <ol className="grid gap-4 md:grid-cols-4">
      {t.sections.demoSteps.map((s, i) => {
        const Icon = icons[i];
        return (
          <li key={s.t} className="card relative p-6">
            <span className="font-display text-sm font-semibold text-accent">0{i + 1}</span>
            <Icon className="mt-4 text-accent" size={22} aria-hidden />
            <h3 className="mt-4 font-semibold">{s.t}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{s.d}</p>
          </li>
        );
      })}
    </ol>
  );
}

export async function CtaBand({ title, body, waText }: { title?: string; body?: string; waText?: string }) {
  const { t } = await getI18n();
  return (
    <section className="bg-forest py-20 text-white">
      <div className="container-shell flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-lime">{t.sections.ctaEyebrow}</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">{title ?? t.sections.ctaTitle}</h2>
          <p className="mt-4 text-sm leading-7 text-white/65">{body ?? t.sections.ctaBody}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <WhatsAppButton text={waText ?? t.wa.general} label="cta_band" />
          <Link href="/contact?type=quotation" className="inline-flex min-h-[44px] items-center rounded-full border border-white/25 px-5 text-sm font-semibold hover:border-lime hover:text-lime">{t.sections.ctaQuote}</Link>
        </div>
      </div>
    </section>
  );
}

export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-forest text-white">
      <div className="grid-dots absolute inset-0 opacity-60" aria-hidden />
      <div className="container-shell relative py-20 sm:py-24">
        <p className="text-[11px] font-bold uppercase tracking-[.2em] text-lime">{eyebrow}</p>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-.04em] sm:text-6xl">{title}</h1>
        {children && <div className="mt-6 max-w-2xl text-base leading-8 text-white/70">{children}</div>}
      </div>
    </section>
  );
}
