import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'lime' | 'outline' | 'ghost' | 'danger';
const variants: Record<Variant, string> = {
  primary: 'bg-forest text-white hover:bg-emerald-600 dark:bg-lime dark:text-forest dark:hover:bg-lime/90',
  lime: 'bg-lime text-forest hover:bg-white',
  outline: 'border border-line bg-surface text-fg hover:border-accent hover:text-accent',
  ghost: 'text-fg hover:bg-surface-2',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};
const base = 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';

export function Button({ variant = 'primary', className, ...props }: ComponentProps<'button'> & { variant?: Variant }) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function ButtonLink({ variant = 'primary', className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(base, variants[variant], className)} {...props} />;
}

const badgeTones = {
  neutral: 'bg-surface-2 text-fg',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald/20 dark:text-lime',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200',
  blue: 'bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200',
  lime: 'bg-lime text-forest',
} as const;
export function Badge({ tone = 'neutral', className, children }: { tone?: keyof typeof badgeTones; className?: string; children: ReactNode }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide', badgeTones[tone], className)}>{children}</span>;
}

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('card p-6', className)} {...props} />;
}

const alertTones = {
  info: { cls: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-100', Icon: Info },
  success: { cls: 'border-emerald/30 bg-emerald-50 text-emerald-600 dark:bg-emerald/15 dark:text-lime', Icon: CheckCircle2 },
  warning: { cls: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100', Icon: AlertTriangle },
  error: { cls: 'border-red-200 bg-red-50 text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-100', Icon: XCircle },
} as const;
export function Alert({ tone = 'info', title, children, className }: { tone?: keyof typeof alertTones; title?: string; children?: ReactNode; className?: string }) {
  const { cls, Icon } = alertTones[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-2xl border p-4 text-sm leading-6', cls, className)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div>{title && <p className="font-semibold">{title}</p>}{children && <div className={title ? 'mt-1' : ''}>{children}</div>}</div>
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      {icon && <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald/20 dark:text-lime">{icon}</div>}
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      {children && <div className="mt-2 max-w-md text-sm leading-6 text-muted">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton h-4', className)} />;
}

export const inputCls = 'w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 aria-[invalid=true]:border-red-500';

export function Field({ label, htmlFor, error, hint, required, children }: { label: string; htmlFor: string; error?: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-fg">{label}{required && <span className="text-red-600" aria-hidden> *</span>}</label>
      {children}
      {hint && !error && <p id={`${htmlFor}-hint`} className="text-xs text-muted">{hint}</p>}
      {error && <p id={`${htmlFor}-error`} className="text-xs font-medium text-red-600 dark:text-red-300">{error}</p>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <div className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
