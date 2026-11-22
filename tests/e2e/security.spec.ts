import { expect, test } from '@playwright/test';

test.describe('security controls', () => {
  test('security headers and nonce CSP on every page', async ({ request }) => {
    const res = await request.get('/');
    const h = res.headers();
    expect(h['strict-transport-security']).toContain('max-age=63072000');
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['content-security-policy']).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(h['content-security-policy']).toContain(`frame-ancestors 'none'`);
    expect(h['x-powered-by']).toBeUndefined();
  });

  test('no CSP violations or console errors on page load', async ({ page }) => {
    const problems: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error' && /Content Security Policy|Refused/.test(m.text())) problems.push(m.text()); });
    await page.goto('/');
    await page.goto('/contact');
    expect(problems).toEqual([]);
  });

  test('admin and admin APIs require authentication', async ({ page, request }) => {
    await page.goto('/admin/leads');
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fadmin%2Fleads/);
    await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
    expect((await request.get('/api/admin/leads/export')).status()).toBe(401);
    expect((await request.get('/api/admin/content/preview?project=11111111-2222-3333-4444-555555555555')).status()).toBe(401);
    expect((await request.get('/api/admin/assets/11111111-2222-3333-4444-555555555555', { maxRedirects: 0 })).status()).toBe(401);
  });

  test('state-changing public APIs reject cross-origin requests', async ({ request }) => {
    for (const path of ['/api/inquiries', '/api/demo/session', '/api/demo/heartbeat', '/api/events']) {
      const res = await request.post(path, { headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, data: {} });
      expect(res.status(), path).toBe(403);
    }
  });

  test('demo endpoints reject missing or forged session credentials', async ({ request }) => {
    expect((await request.post('/api/demo/heartbeat', { data: {} })).status()).toBe(401);
    const forged = await request.get('/api/demo/sandbox?product=x&module=m0', { headers: { cookie: 'nx_demo=not-a-valid-cookie' } });
    expect(forged.status()).toBe(401);
    const bad = await request.get('/api/demo/sandbox?product=../../etc&module=m9', { headers: { cookie: `nx_demo=11111111-2222-3333-4444-555555555555.${'a'.repeat(64)}` } });
    expect([400, 503]).toContain(bad.status());
  });

  test('auth callback rejects bad links and open redirects', async ({ page }) => {
    await page.goto('/auth/callback?code=bogus&next=//evil.com');
    await expect(page).toHaveURL(/\/auth\/login\?error=link_invalid/);
    await expect(page.getByRole('main').getByRole('alert')).toContainText('invalid or was already used');
  });

  test('reset-password page requires a recovery session', async ({ page }) => {
    await page.goto('/auth/reset-password');
    await expect(page.getByRole('heading', { name: 'Reset link required' })).toBeVisible();
  });

  test('sign-up enforces the 12-character password policy before contacting the server', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.getByLabel('Work email').fill('policy-check@nexora-test.invalid');
    await page.getByLabel('Password', { exact: true }).fill('Short1!');
    await expect(page.getByText('Use at least 12 characters.')).toBeVisible();
    await page.getByLabel('Password', { exact: true }).fill('Teal-Harbor-29-Mango');
    await expect(page.getByText(/Good|Strong/)).toBeVisible();
    await page.getByLabel('Password', { exact: true }).fill('short');
    await page.getByLabel('Confirm password').fill('short');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.locator('#password-error')).toContainText('Use at least 12 characters.');
  });
});
