import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createClient } from '@supabase/supabase-js';

const DB = process.env.E2E_DB === '1'; // set in CI when the app can reach Supabase
// Live submissions only when the test can clean up after itself (never leave test leads in production).
const CLEANUP = process.env.E2E_SUPABASE_URL && process.env.E2E_SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.E2E_SUPABASE_URL, process.env.E2E_SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

test.describe('public website', () => {
  test('home renders brand, tagline, primary CTAs and honest catalog state', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/NEXORA DIGITAL — Technology & Product Studio/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Build. Innovate.');
    await expect(page.getByRole('link', { name: /Explore products/ }).first()).toBeVisible();
    // No unverified metrics on the page.
    await expect(page.locator('body')).not.toContainText('20+');
    await expect(page.getByText(/being finalised|temporarily unavailable/).or(page.locator('article').first())).toBeVisible();
  });

  test('all marketing and legal routes render with a single h1', async ({ page }) => {
    for (const path of ['/products', '/solutions', '/pricing', '/services/custom-development', '/partners', '/insights', '/contact', '/privacy', '/terms', '/cookies', '/demo-disclaimer']) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await expect(page.getByRole('heading', { level: 1 }), path).toHaveCount(1);
    }
    await page.goto('/privacy');
    await expect(page.getByText('Draft — pending owner and legal review')).toBeVisible();
  });

  test('draft products and their demos are not public', async ({ page }) => {
    expect((await page.goto('/products/waroeng-suramadu-erp'))?.status()).toBe(404);
    expect((await page.goto('/demo/edu-admin'))?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /isn.t here/ })).toBeVisible();
  });

  test('pricing never invents prices', async ({ page }) => {
    await page.goto('/pricing');
    for (const t of ['Starter', 'Professional', 'Enterprise', 'Custom']) await expect(page.getByRole('heading', { name: t, exact: true })).toBeVisible();
    await expect(page.getByText('Price on request')).toHaveCount(4);
    await expect(page.locator('body')).not.toContainText(/Rp\s?\d|IDR\s?\d{3}/);
  });

  test('consent banner: nothing tracked until opt-in, choice persists', async ({ page, context }) => {
    const events: string[] = [];
    page.on('request', (r) => { if (r.url().endsWith('/api/events')) events.push(r.url()); });
    await page.goto('/');
    const dialog = page.getByRole('dialog', { name: 'Your privacy choices' });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(500);
    expect(events).toHaveLength(0);
    await dialog.getByRole('button', { name: 'Essential only' }).click();
    await expect(dialog).toBeHidden();
    expect((await context.cookies()).find((c) => c.name === 'nx_consent')?.value).toBe('essential');
    await page.goto('/products');
    await expect(page.getByRole('dialog', { name: 'Your privacy choices' })).toBeHidden();
    expect(events).toHaveLength(0);
    await page.getByRole('button', { name: 'Cookie settings' }).click();
    await page.getByRole('button', { name: 'Allow anonymous analytics' }).click();
    const req = page.waitForRequest((r) => r.url().endsWith('/api/events') && (r.postData() ?? '').includes('"/solutions"'));
    await page.goto('/solutions');
    expect(JSON.parse((await req).postData() ?? '{}')).toMatchObject({ event: 'page_view', path: '/solutions' });
    expect(JSON.parse((await req).postData() ?? '{}').sessionHash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('theme toggle switches and persists', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const before = await html.getAttribute('data-theme');
    await page.getByRole('button', { name: /Switch to (dark|light) theme/ }).first().click();
    const after = await html.getAttribute('data-theme');
    expect(after).not.toBe(before);
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', after!);
  });

  test('contact form validates client-side and handles server outcome', async ({ page }) => {
    await page.goto('/contact?type=quotation');
    await page.getByRole('dialog').getByRole('button', { name: 'Essential only' }).click();
    await expect(page.getByLabel('What can we help with?')).toHaveValue('quotation');
    await expect(page.getByLabel('Budget range')).toBeVisible();
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('form').getByRole('alert')).toContainText('Please check the highlighted fields.');
    await expect(page.getByText('Please enter your name.')).toBeVisible();
    await expect(page.getByText('Please accept the privacy policy so we can respond.')).toBeVisible();
    if (DB && !CLEANUP) return; // reachable DB but no cleanup credentials: stop before writing data
    const email = `e2e+${Date.now()}@nexora-test.invalid`;
    await page.getByLabel('Full name').fill('E2E Test');
    await page.getByLabel('Work email').fill(email);
    await page.getByLabel('How can we help?').fill('Automated end-to-end test inquiry. Please ignore.');
    await page.getByLabel(/I agree that NEXORA DIGITAL may store/).check();
    await page.getByRole('button', { name: 'Send message' }).click();
    if (DB && CLEANUP) {
      await expect(page.getByText('Thank you — we received your message')).toBeVisible();
      const { data } = await CLEANUP.from('leads').select('id').eq('email', email);
      expect(data).toHaveLength(1);
      await CLEANUP.from('leads').delete().eq('email', email);
    }
    else await expect(page.locator('form').getByRole('alert')).toContainText(/could not save|try again/i); // DB unreachable → graceful error state
  });

  test('key pages have no serious accessibility violations (axe)', async ({ page }) => {
    for (const path of ['/', '/products', '/contact', '/pricing', '/auth/login']) {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).exclude('[role="dialog"]').analyze();
      const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
      expect(serious.map((v) => `${path}: ${v.id} (${v.nodes.length})`)).toEqual([]);
    }
  });

  test('SEO: robots, sitemap, canonical', async ({ page, request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /admin');
    expect(robots).toContain('Sitemap:');
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('/products');
    expect(sitemap).not.toContain('waroeng-suramadu-erp'); // drafts excluded
    await page.goto('/pricing');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/pricing$/);
  });
});
