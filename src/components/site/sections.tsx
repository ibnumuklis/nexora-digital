import Link from 'next/link';
import { ArrowUpRight, Clock, Code2, Handshake, KeyRound, LifeBuoy, Repeat, ShieldCheck, Sparkles, TimerReset } from 'lucide-react';
import { ButtonLink } from '@/components/ui';

export const ENGAGEMENT_MODELS = [
  { icon: Repeat, title: 'SaaS subscription', desc: 'Use a NEXORA product as a hosted service on a monthly or annual plan.' },
  { icon: KeyRound, title: 'Lifetime license', desc: 'A one-time license with clearly defined scope, update and support terms.' },
  { icon: Code2, title: 'Custom development', desc: 'Software designed and built around your processes, from discovery to launch.' },
  { icon: LifeBuoy, title: 'Maintenance & support', desc: 'Ongoing care for existing systems: fixes, updates, monitoring and improvements.' },
  { icon: Handshake, title: 'White-label & reseller', desc: 'Offer NEXORA products under your brand or to your clients through a partnership.' },
] as const;

export const PACKAGE_TIERS = [
  { key: 'starter', name: 'Starter', desc: 'For small teams validating a digital workflow.' },
  { key: 'professional', name: 'Professional', desc: 'For growing businesses that need more modules, users and support.' },
  { key: 'enterprise', name: 'Enterprise', desc: 'For multi-branch organisations with integration, security and SLA needs.' },
  { key: 'custom', name: 'Custom', desc: 'Scope, features and commercial model tailored to your requirements.' },
] as const;

export function EngagementGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ENGAGEMENT_MODELS.map((m) => (
        <div key={m.title} className="card p-7">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald/20 dark:text-lime"><m.icon size={22} aria-hidden /></span>
          <h3 className="mt-6 text-lg font-semibold">{m.title}</h3>
          <p className="mt-3 text-sm leading-6 text-muted">{m.desc}</p>
        </div>
      ))}
    </div>
  );
}

export function DemoExplainer() {
  const steps = [
    { icon: Sparkles, t: 'Choose a product', d: 'Products with a live demo show a “Try demo” button.' },
    { icon: Clock, t: 'Timed session', d: 'Sessions last a few minutes (typically 7) and end after inactivity. The timer is enforced by our server.' },
    { icon: ShieldCheck, t: 'Sample data only', d: 'Demos run on synthetic data with restricted permissions — never on customer data.' },
    { icon: TimerReset, t: 'Talk to us', d: 'When the session ends, book a consultation or request a quote for full access.' },
  ];
  return (
    <ol className="grid gap-4 md:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.t} className="card relative p-6">
          <span className="font-display text-sm font-semibold text-accent">0{i + 1}</span>
          <s.icon className="mt-4 text-accent" size={22} aria-hidden />
          <h3 className="mt-4 font-semibold">{s.t}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{s.d}</p>
        </li>
      ))}
    </ol>
  );
}

export function CtaBand({ title = 'Have a process to improve or an idea to build?', body = 'Tell us what you need. We will reply with honest next steps — a product fit, a custom scope, or a referral if we are not the right team.' }: { title?: string; body?: string }) {
  return (
    <section className="bg-forest py-20 text-white">
      <div className="container-shell flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-lime">Start a conversation</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 text-sm leading-7 text-white/65">{body}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/contact?type=consultation" variant="lime">Book a consultation <ArrowUpRight size={15} aria-hidden /></ButtonLink>
          <Link href="/contact?type=quotation" className="inline-flex min-h-[44px] items-center rounded-full border border-white/25 px-5 text-sm font-semibold hover:border-lime hover:text-lime">Request a quote</Link>
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
