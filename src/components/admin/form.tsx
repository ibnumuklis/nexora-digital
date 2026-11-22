'use client';
import { createContext, useActionState, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Alert, Button, Field, inputCls } from '@/components/ui';
import type { ActionResult } from '@/lib/admin/action';

const ErrCtx = createContext<Record<string, string>>({});

type ServerAction = (prev: ActionResult, fd: FormData) => Promise<ActionResult>;

export function ActionForm({ action, children, className = 'grid gap-4', resetOnSuccess = false, confirm, onSuccess }: { action: ServerAction; children: ReactNode; className?: string; resetOnSuccess?: boolean; confirm?: string; onSuccess?: (r: ActionResult) => void }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.(state);
    }
  }, [state, resetOnSuccess, onSuccess]);
  return (
    <ErrCtx.Provider value={state.fieldErrors ?? {}}>
      <form ref={ref} action={formAction} className={className} onSubmit={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}>
        {state.error && <Alert tone="error">{state.error}</Alert>}
        {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}
        {children}
      </form>
    </ErrCtx.Provider>
  );
}

export function SubmitButton({ children, variant = 'primary', className }: { children: ReactNode; variant?: 'primary' | 'outline' | 'danger' | 'ghost' | 'lime'; className?: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant={variant} disabled={pending} className={className}>{pending ? <><Loader2 size={15} className="animate-spin" aria-hidden /> Saving…</> : children}</Button>;
}

type Common = { name: string; label: string; required?: boolean; hint?: string; defaultValue?: string | number | null };

export function TextInput({ name, label, required, hint, defaultValue, type = 'text', maxLength, placeholder, ...rest }: Common & { type?: string; maxLength?: number; placeholder?: string; min?: number; max?: number; step?: string; pattern?: string }) {
  const err = useContext(ErrCtx)[name];
  return (
    <Field label={label} htmlFor={`f-${name}`} required={required} hint={hint} error={err}>
      <input id={`f-${name}`} name={name} type={type} required={required} defaultValue={defaultValue ?? ''} maxLength={maxLength} placeholder={placeholder} className={inputCls} aria-invalid={!!err || undefined} {...rest} />
    </Field>
  );
}

export function TextArea({ name, label, required, hint, defaultValue, rows = 4, maxLength }: Common & { rows?: number; maxLength?: number }) {
  const err = useContext(ErrCtx)[name];
  return (
    <Field label={label} htmlFor={`f-${name}`} required={required} hint={hint} error={err}>
      <textarea id={`f-${name}`} name={name} rows={rows} required={required} defaultValue={defaultValue ?? ''} maxLength={maxLength} className={inputCls} aria-invalid={!!err || undefined} />
    </Field>
  );
}

export function SelectInput({ name, label, required, hint, defaultValue, options }: Common & { options: { value: string; label: string }[] }) {
  const err = useContext(ErrCtx)[name];
  return (
    <Field label={label} htmlFor={`f-${name}`} required={required} hint={hint} error={err}>
      <select id={`f-${name}`} name={name} required={required} defaultValue={defaultValue ?? ''} className={inputCls} aria-invalid={!!err || undefined}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export function Checkbox({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-emerald" />
      <span>{label}{hint && <span className="block text-xs text-muted">{hint}</span>}</span>
    </label>
  );
}
