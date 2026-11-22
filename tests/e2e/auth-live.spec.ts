import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * Live authentication E2E (sign-in, session, role gating, password change, sign-out, unconfirmed email).
 * Requires network access to Supabase and a service-role key ONLY in the CI/test environment:
 *   E2E_DB=1 E2E_SUPABASE_URL=... E2E_SUPABASE_SERVICE_ROLE_KEY=...
 * Test users use the reserved `.invalid` TLD, are created confirmed via the Admin API (no emails sent)
 * and deleted afterwards.
 */
const url = process.env.E2E_SUPABASE_URL;
const key = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
test.skip(!url || !key || process.env.E2E_DB !== '1', 'Live auth E2E requires E2E_DB=1, E2E_SUPABASE_URL and E2E_SUPABASE_SERVICE_ROLE_KEY');

const admin = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
const stamp = Date.now();
const staff = { email: `e2e-staff-${stamp}@nexora-test.invalid`, password: 'E2e-Staff-Pass-2026!' };
const outsider = { email: `e2e-outsider-${stamp}@nexora-test.invalid`, password: 'E2e-Outsider-Pass-2026!' };
const unconfirmed = { email: `e2e-unconfirmed-${stamp}@nexora-test.invalid`, password: 'E2e-Unconf-Pass-2026!' };
const ids: string[] = [];

test.beforeAll(async () => {
  for (const [u, confirm] of [[staff, true], [outsider, true], [unconfirmed, false]] as const) {
    const { data, error } = await admin!.auth.admin.createUser({ email: u.email, password: u.password, email_confirm: confirm });
    if (error) throw error;
    ids.push(data.user.id);
  }
  const { error } = await admin!.from('staff_members').insert({ user_id: ids[0], role: 'content_editor', is_active: true });
  if (error) throw error;
});

test.afterAll(async () => {
  for (const id of ids) await admin!.auth.admin.deleteUser(id);
});

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in securely' }).click();
}

test('wrong password shows a generic error (no account enumeration)', async ({ page }) => {
  await login(page, staff.email, 'Not-The-Right-Password-1');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Email or password is incorrect.');
  await login(page, `nobody-${stamp}@nexora-test.invalid`, 'Whatever-Password-123');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Email or password is incorrect.');
});

test('unconfirmed email cannot sign in', async ({ page }) => {
  await login(page, unconfirmed.email, unconfirmed.password);
  await expect(page.getByRole('main').getByRole('alert')).toContainText('confirm your email');
});

test('signed-in non-staff user is denied the admin console', async ({ page }) => {
  await login(page, outsider.email, outsider.password);
  await expect(page).toHaveURL(/\/auth\/no-access/);
});

test('staff session: role-filtered admin, RBAC on direct URLs, password change, sign-out', async ({ page, context }) => {
  await login(page, staff.email, staff.password);
  await expect(page).toHaveURL(/\/admin$/);
  const nav = page.getByRole('navigation', { name: 'Admin' });
  await expect(nav.getByRole('link', { name: 'Content Studio' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Leads & CRM' })).toHaveCount(0);
  await page.goto('/admin/leads');
  await expect(page).toHaveURL(/\/admin\?denied=crm\.read/);
  expect((await page.request.get('/api/admin/leads/export')).status()).toBe(403);
  // Session survives reload (cookie-based SSR session).
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  // Password change enforces policy then succeeds.
  await page.goto('/admin/account');
  await page.getByLabel('New password').fill('weakpass');
  await page.getByLabel('Confirm new password').fill('weakpass');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.locator('#password-error')).toContainText('12 characters');
  await page.getByLabel('New password').fill('E2e-Changed-Pass-2026!');
  await page.getByLabel('Confirm new password').fill('E2e-Changed-Pass-2026!');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.getByText('Password updated.')).toBeVisible();
  // Sign out clears the session.
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/auth\/login\?signed_out=1/);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/auth\/login/);
  expect((await context.cookies()).some((c) => c.name.startsWith('sb-') && c.value)).toBe(false);
  // New password works.
  await login(page, staff.email, 'E2e-Changed-Pass-2026!');
  await expect(page).toHaveURL(/\/admin$/);
});

test('password reset request responds identically for unknown accounts', async ({ page }) => {
  await page.goto('/auth/forgot-password');
  await page.getByLabel('Email').fill(`nobody-${stamp}@nexora-test.invalid`);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByRole('status').or(page.getByRole('main').getByRole('alert'))).toContainText(/If an account exists|Too many/);
});
