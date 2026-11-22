import 'server-only';
import { revalidatePath } from 'next/cache';
import type { z } from 'zod';
import { AuthzError, requirePermission, type StaffContext } from '@/lib/auth/session';
import type { Permission } from '@/lib/auth/rbac';
import { zodFieldErrors } from '@/lib/validation/forms';

export type ActionResult = { ok?: boolean; message?: string; error?: string; fieldErrors?: Record<string, string>; id?: string };

/** Map Postgres/PostgREST errors to safe messages (never leak SQL). */
export function dbError(e: { code?: string; message?: string } | null | undefined): string {
  if (!e) return 'Unexpected error.';
  if (e.code === '23505') return 'That value already exists (must be unique).';
  if (e.code === '23514') return /verification/.test(e.message ?? '') ? 'Mark the product as verified before publishing.' : 'A value is outside the allowed range.';
  if (e.code === '23503') return 'This record is referenced elsewhere or a linked record is missing.';
  if (e.code === '42501') return 'Your role is not allowed to do this.';
  if (e.code === 'PGRST116') return 'Record not found or not permitted.';
  if (e.message && /^[a-z_ ]{3,80}$/i.test(e.message) && !/select|insert|update|delete|relation|column/i.test(e.message)) return e.message;
  if (e.message && /(only admins|only marketing|must be approved|requires an amount|demo can only|last active super_admin|invalid render job)/i.test(e.message)) return e.message.charAt(0).toUpperCase() + e.message.slice(1) + '.';
  return 'The change could not be saved.';
}

/**
 * Wrap a server action: authorise (server-side), validate with zod, run, revalidate.
 * RLS still applies to every query because `ctx.supabase` acts as the signed-in user.
 */
export async function runAction<S extends z.ZodTypeAny>(
  permission: Permission,
  schema: S,
  raw: unknown,
  fn: (ctx: StaffContext, data: z.infer<S>) => Promise<ActionResult | void>,
  revalidate: string[] = [],
): Promise<ActionResult> {
  let ctx: StaffContext;
  try {
    ctx = await requirePermission(permission);
  } catch (e) {
    return { error: e instanceof AuthzError && e.status === 401 ? 'Your session has expired. Sign in again.' : 'Your role is not allowed to do this.' };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: 'Please check the highlighted fields.', fieldErrors: zodFieldErrors(parsed.error) };
  try {
    const res = (await fn(ctx, parsed.data)) ?? { ok: true };
    revalidate.forEach((p) => revalidatePath(p, 'layout'));
    return res;
  } catch (e) {
    return { error: dbError(e as { code?: string; message?: string }) };
  }
}

export function formToObject(fd: FormData): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (k.startsWith('$ACTION')) continue;
    if (k in o) o[k] = ([] as unknown[]).concat(o[k], v);
    else o[k] = v;
  }
  return o;
}

/** Throw on a Supabase error so runAction maps it. */
export function must<T>(res: { data: T; error: { code?: string; message?: string } | null }): NonNullable<T> {
  if (res.error) throw res.error;
  if (res.data === null || res.data === undefined) throw { code: 'PGRST116', message: 'not found' };
  return res.data as NonNullable<T>;
}
