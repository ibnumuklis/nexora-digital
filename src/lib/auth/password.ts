/**
 * Application-level password policy (NEXORA requires ≥ 12 characters).
 * Supabase Free Plan has no leaked-password (HIBP) check, so we add a local denylist and
 * character-class / repetition rules. See docs/SECURITY_FREE_PLAN_LIMITATIONS.md.
 */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt limit used by Supabase Auth

const COMMON = new Set([
  'password1234', 'password12345', 'password123456', 'passw0rd1234', 'qwerty123456', 'qwertyuiop12',
  '123456789012', '1234567890ab', 'iloveyou1234', 'admin1234567', 'administrator', 'welcome12345',
  'letmein12345', 'nexoradigital', 'nexora123456', 'indonesia123', 'bismillah123', 'supabase1234',
  'changeme1234', 'abcdefghijkl', 'aaaaaaaaaaaa', '111111111111', 'p@ssw0rd1234', 'katasandi123',
]);

export type PasswordCheck = { ok: boolean; errors: string[]; score: 0 | 1 | 2 | 3 | 4 };

export function checkPassword(password: string, context: { email?: string | null } = {}): PasswordCheck {
  const errors: string[] = [];
  const pw = password ?? '';
  if (pw.length < PASSWORD_MIN_LENGTH) errors.push(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
  if (pw.length > PASSWORD_MAX_LENGTH) errors.push(`Use at most ${PASSWORD_MAX_LENGTH} characters.`);
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (classes < 3) errors.push('Mix at least three of: lowercase, uppercase, numbers, symbols.');
  if (/(.)\1{3,}/.test(pw)) errors.push('Avoid repeating the same character four or more times.');
  const lower = pw.toLowerCase();
  if (COMMON.has(lower) || /^(password|qwerty|123456|nexora)/.test(lower)) errors.push('This password is too common.');
  const local = context.email?.split('@')[0]?.toLowerCase();
  if (local && local.length >= 4 && lower.includes(local)) errors.push('Do not include your email name in the password.');

  let score = 0;
  if (pw.length >= PASSWORD_MIN_LENGTH) score++;
  if (pw.length >= 16) score++;
  if (classes >= 3) score++;
  if (classes === 4 && pw.length >= 14) score++;
  return { ok: errors.length === 0, errors, score: Math.min(4, errors.length ? Math.min(score, 1) : score) as PasswordCheck['score'] };
}
