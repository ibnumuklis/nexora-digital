import 'server-only';
import { inquirySchema, INQUIRY_ERRORS, zodFieldErrors } from '@/lib/validation/forms';
import { rateLimit } from '@/lib/http/rate-limit';
import type { createSupabasePublicClient } from '@/lib/supabase/server';

type Db = Pick<ReturnType<typeof createSupabasePublicClient>, 'rpc'>;

export type InquiryOutcome = { status: number; body: { ok: true } | { error: string; fieldErrors?: Record<string, string> } };

/** Validate + rate limit + submit through the DB RPC. Pure enough to unit test with a fake db. */
export async function handleInquiry(input: unknown, ctx: { ip: string; visitorHash: string | null; db: Db }): Promise<InquiryOutcome> {
  const rl = rateLimit(`inq:${ctx.ip}`, 5, 10 * 60_000);
  if (!rl.allowed) return { status: 429, body: { error: INQUIRY_ERRORS.rate_limited.message } };

  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) return { status: 400, body: { error: 'Please check the highlighted fields.', fieldErrors: zodFieldErrors(parsed.error) } };
  const d = parsed.data;
  if (d.website) return { status: 200, body: { ok: true } }; // honeypot: pretend success

  const { error } = await ctx.db.rpc('submit_inquiry', {
    p: { ...d, visitor_hash: ctx.visitorHash ?? undefined, website: undefined },
  });
  if (error) {
    const mapped = INQUIRY_ERRORS[error.message];
    if (mapped) return { status: mapped.status, body: { error: mapped.message } };
    return { status: 503, body: { error: 'We could not save your message right now. Please try again in a few minutes.' } };
  }
  return { status: 200, body: { ok: true } };
}
