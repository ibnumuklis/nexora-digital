'use client';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { Alert, Button, Field, inputCls } from '@/components/ui';
import { checkPassword, PASSWORD_MIN_LENGTH } from '@/lib/auth/password';
import { requestPasswordReset, signInWithMagicLink, signInWithPassword, signUp, updatePassword, type AuthState } from '@/app/auth/actions';

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return <Button type="submit" disabled={pending} className="w-full">{pending ? <><Loader2 className="animate-spin" size={16} aria-hidden /> Please wait…</> : children}</Button>;
}

function PasswordInput({ id, name, autoComplete, invalid, describedBy, onChange }: { id: string; name: string; autoComplete: string; invalid?: boolean; describedBy?: string; onChange?: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} name={name} type={show ? 'text' : 'password'} autoComplete={autoComplete} required maxLength={72} className={`${inputCls} pr-12`} aria-invalid={invalid || undefined} aria-describedby={describedBy} onChange={(e) => onChange?.(e.target.value)} />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-fg" aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
      </button>
    </div>
  );
}

function StrengthMeter({ value, email }: { value: string; email?: string }) {
  if (!value) return <p id="pw-hint" className="text-xs text-muted">At least {PASSWORD_MIN_LENGTH} characters, mixing three of: lowercase, uppercase, numbers, symbols.</p>;
  const r = checkPassword(value, { email });
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div id="pw-hint" aria-live="polite">
      <div className="flex gap-1" aria-hidden>{[0, 1, 2, 3].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < r.score ? (r.ok ? 'bg-emerald' : 'bg-amber-500') : 'bg-surface-2'}`} />)}</div>
      <p className={`mt-1.5 text-xs ${r.ok ? 'text-emerald-600 dark:text-lime' : 'text-muted'}`}>{r.ok ? labels[r.score] : r.errors[0]}</p>
    </div>
  );
}

const LOGIN_ERRORS: Record<string, string> = {
  link_expired: 'That link has expired. Request a new one below.',
  link_invalid: 'That link is invalid or was already used.',
};

export function LoginForm({ next, error, signedOut }: { next: string; error?: string; signedOut?: boolean }) {
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [pwState, pwAction, pwPending] = useActionState<AuthState, FormData>(signInWithPassword, {});
  const [mlState, mlAction, mlPending] = useActionState<AuthState, FormData>(signInWithMagicLink, {});
  return (
    <div>
      <p className="eyebrow">NEXORA Control Center</p>
      <h1 className="mt-2 text-3xl font-semibold">Staff sign in</h1>
      <div className="mt-6 grid gap-3">
        {signedOut && <Alert tone="success">You have been signed out.</Alert>}
        {error && LOGIN_ERRORS[error] && <Alert tone="error">{LOGIN_ERRORS[error]}</Alert>}
      </div>
      <div role="tablist" aria-label="Sign-in method" className="mt-6 grid grid-cols-2 rounded-full bg-surface-2 p-1 text-sm font-semibold">
        <button role="tab" aria-selected={mode === 'password'} onClick={() => setMode('password')} className={`min-h-[40px] rounded-full ${mode === 'password' ? 'bg-surface shadow-card' : 'text-muted'}`}>Password</button>
        <button role="tab" aria-selected={mode === 'magic'} onClick={() => setMode('magic')} className={`min-h-[40px] rounded-full ${mode === 'magic' ? 'bg-surface shadow-card' : 'text-muted'}`}>Email link</button>
      </div>
      {mode === 'password' ? (
        <form action={pwAction} className="mt-6 grid gap-4">
          <input type="hidden" name="next" value={next} />
          {pwState.error && <Alert tone="error">{pwState.error}</Alert>}
          <Field label="Email" htmlFor="email"><input id="email" name="email" type="email" autoComplete="username" required className={inputCls} /></Field>
          <Field label="Password" htmlFor="password"><PasswordInput id="password" name="password" autoComplete="current-password" /></Field>
          <div className="text-right text-sm"><Link href="/auth/forgot-password" className="font-semibold text-accent">Forgot password?</Link></div>
          <Submit pending={pwPending}><LockKeyhole size={15} aria-hidden /> Sign in securely</Submit>
        </form>
      ) : (
        <form action={mlAction} className="mt-6 grid gap-4">
          <input type="hidden" name="next" value={next} />
          {mlState.error && <Alert tone="error">{mlState.error}</Alert>}
          {mlState.ok && <Alert tone="success">{mlState.ok}</Alert>}
          <Field label="Email" htmlFor="ml-email" hint="We will email you a one-time sign-in link."><input id="ml-email" name="email" type="email" autoComplete="email" required className={inputCls} /></Field>
          <Submit pending={mlPending}><Mail size={15} aria-hidden /> Email me a sign-in link</Submit>
        </form>
      )}
      <p className="mt-8 text-center text-sm text-muted">New team member? <Link href="/auth/signup" className="font-semibold text-accent">Create an account</Link></p>
    </div>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});
  const [pw, setPw] = useState('');
  const [email, setEmail] = useState('');
  if (state.ok) return <div><h1 className="text-3xl font-semibold">Confirm your email</h1><Alert tone="success" className="mt-6">{state.ok}</Alert><p className="mt-6 text-sm"><Link href="/auth/login" className="font-semibold text-accent">Back to sign in</Link></p></div>;
  const fe = state.fieldErrors ?? {};
  return (
    <div>
      <p className="eyebrow">Staff account</p>
      <h1 className="mt-2 text-3xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Accounts have no access until a Super Admin assigns a role.</p>
      <form action={action} className="mt-6 grid gap-4">
        {state.error && <Alert tone="error">{state.error}</Alert>}
        <Field label="Work email" htmlFor="email" error={fe.email}><input id="email" name="email" type="email" autoComplete="email" required className={inputCls} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!fe.email || undefined} /></Field>
        <Field label="Password" htmlFor="password" error={fe.password}><PasswordInput id="password" name="password" autoComplete="new-password" invalid={!!fe.password} describedBy="pw-hint" onChange={setPw} /></Field>
        <StrengthMeter value={pw} email={email} />
        <Field label="Confirm password" htmlFor="confirm" error={fe.confirm}><PasswordInput id="confirm" name="confirm" autoComplete="new-password" invalid={!!fe.confirm} /></Field>
        <Submit pending={pending}>Create account</Submit>
      </form>
      <p className="mt-8 text-center text-sm text-muted">Already have an account? <Link href="/auth/login" className="font-semibold text-accent">Sign in</Link></p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  return (
    <div>
      <h1 className="text-3xl font-semibold">Reset your password</h1>
      <p className="mt-2 text-sm text-muted">Enter your account email. We will send a reset link valid for one hour.</p>
      <form action={action} className="mt-6 grid gap-4">
        {state.error && <Alert tone="error">{state.error}</Alert>}
        {state.ok && <Alert tone="success">{state.ok}</Alert>}
        <Field label="Email" htmlFor="email"><input id="email" name="email" type="email" autoComplete="email" required className={inputCls} /></Field>
        <Submit pending={pending}>Send reset link</Submit>
      </form>
      <p className="mt-8 text-center text-sm"><Link href="/auth/login" className="font-semibold text-accent">Back to sign in</Link></p>
    </div>
  );
}

export function ResetPasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, {});
  const [pw, setPw] = useState('');
  const fe = state.fieldErrors ?? {};
  if (state.ok) return <div><h1 className="text-3xl font-semibold">Password updated</h1><Alert tone="success" className="mt-6">{state.ok}</Alert><Link href="/admin" className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-forest px-5 text-sm font-semibold text-white dark:bg-lime dark:text-forest">Continue to admin</Link></div>;
  return (
    <div>
      <h1 className="text-3xl font-semibold">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted">For {email}</p>
      <form action={action} className="mt-6 grid gap-4">
        {state.error && <Alert tone="error">{state.error}</Alert>}
        <Field label="New password" htmlFor="password" error={fe.password}><PasswordInput id="password" name="password" autoComplete="new-password" invalid={!!fe.password} describedBy="pw-hint" onChange={setPw} /></Field>
        <StrengthMeter value={pw} email={email} />
        <Field label="Confirm new password" htmlFor="confirm" error={fe.confirm}><PasswordInput id="confirm" name="confirm" autoComplete="new-password" invalid={!!fe.confirm} /></Field>
        <Submit pending={pending}>Update password</Submit>
      </form>
    </div>
  );
}
