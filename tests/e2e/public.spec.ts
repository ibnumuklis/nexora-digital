import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createClient } from '@supabase/supabase-js';

const DB = process.env.E2E_DB === '1'; // set in CI when the app can reach Supabase
// Live submissions only when the test can clean up after itself (never leave test leads in production).
const CLEANUP = process.env.E2E_SUPABASE_URL && process.env.E2E_SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.E2E_SUPABASE_URL, process.env.E2E_SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

test.describe('public website', () => {
  test('home defaults to Bahasa Indonesia with WhatsApp-first CTA and honest catalog state', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(page).toHaveTitle(/NEXORA DIGITAL — Aplikasi & Sistem Digital untuk Usaha Indonesia/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sistem digital');
    const wa = page.getByRole('main').getByRole('link', { name: /Chat WhatsApp/ }).first();
    await expect(wa).toHaveAttribute('href', /^https:\/\/wa\.me\/6282396050549\?text=/);
    await expect(page.getByRole('link', { name: /Chat dengan kami di WhatsApp/ })).toBeVisible(); // floating button
    await expect(page.getByRole('heading', { name: 'UMKM, kuliner & ritel' })).toBeVisible();
    // No unverified metrics on the page.
    await expect(page.locator('body')).not.toContainText('20+');
    await expect(page.getByText(/sedang disiapkan|tidak dapat dimuat/).or(page.locator('article').first())).toBeVisible();
  });

  test('language toggle switches to English and persists', async ({ page, context }) => {
    test.setTimeout(150_000);
    await page.goto('/');
    await page.getByRole('group', { name: 'Bahasa' }).getByRole('button', { name: 'English' }).first().click();
    // Server re-render after the cookie change (slow locally when the database host is unreachable).
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Build. Innovate.', { timeout: 45_000 });
    expect((await context.cookies()).find((c) => c.name === 'nx_lang')?.value).toBe('en');
    await page.goto('/pricing');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Clear prices');
    await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'Bahasa Indonesia' }).first().click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Harga jelas', { timeout: 45_000 });
  });

  test('all marketing and legal routes render with a single h1', async ({ page }) => {
    for (const path of ['/products', '/solutions', '/pricing', '/services/custom-development', '/partners', '/insights', '/contact', '/privacy', '/terms', '/cookies', '/demo-disclaimer']) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await expect(page.getByRole('heading', { level: 1 }), path).toHaveCount(1);
    }
    await page.goto('/privacy');
    await expect(page.getByText('nexoracreativedigital@gmail.com').first()).toBeVisible();
    await expect(page.getByText(/UU PDP/).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kebijakan privasi');
  });

  test('unknown or unpublished products and their demos are not public', async ({ page }) => {
    expect((await page.goto('/products/not-a-published-product'))?.status()).toBe(404);
    expect((await page.goto('/demo/not-a-published-product'))?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Halaman ini tidak ada.' })).toBeVisible();
  });

  test('pricing shows starting prices from the database only (no invented prices)', async ({ page }) => {
    await page.goto('/pricing');
    for (const t of ['Starter', 'Professional', 'Enterprise', 'Custom']) await expect(page.getByRole('heading', { name: t, exact: true })).toBeVisible();
    const table = page.getByRole('table');
    if (await table.count()) {
      await expect(table.getByText(/Rp\s?\d/).first()).toBeVisible();
      await expect(table.getByText('Mulai dari').first()).toBeVisible();
    } else {
      await expect(page.getByText('Daftar harga sedang disiapkan')).toBeVisible();
      await expect(page.locator('main')).not.toContainText(/Rp\s?\d/);
    }
  });

  test('consent banner: nothing tracked until opt-in, choice persists', async ({ page, context }) => {
    const events: string[] = [];
    page.on('request', (r) => { if (r.url().endsWith('/api/events')) events.push(r.url()); });
    await page.goto('/');
    const dialog = page.getByRole('dialog', { name: 'Pilihan privasi Anda' });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(500);
    expect(events).toHaveLength(0);
    await dialog.getByRole('button', { name: 'Hanya yang penting' }).click();
    await expect(dialog).toBeHidden();
    expect((await context.cookies()).find((c) => c.name === 'nx_consent')?.value).toBe('essential');
    await page.goto('/products');
    await expect(page.getByRole('dialog', { name: 'Pilihan privasi Anda' })).toBeHidden();
    expect(events).toHaveLength(0);
    await page.getByRole('button', { name: 'Pengaturan cookie' }).click();
    await page.getByRole('button', { name: 'Izinkan analitik anonim' }).click();
    const req = page.waitForRequest((r) => r.url().endsWith('/api/events') && (r.postData() ?? '').includes('"/solutions"'));
    await page.goto('/solutions');
    expect(JSON.parse((await req).postData() ?? '{}')).toMatchObject({ event: 'page_view', path: '/solutions' });
    expect(JSON.parse((await req).postData() ?? '{}').sessionHash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('theme toggle switches and persists', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const before = await html.getAttribute('data-theme');
    await page.getByRole('button', { name: /Ganti ke tema (gelap|terang)/ }).first().click();
    const after = await html.getAttribute('data-theme');
    expect(after).not.toBe(before);
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', after!);
  });

  test('contact form validates client-side and handles server outcome', async ({ page }) => {
    await page.goto('/contact?type=quotation');
    await page.getByRole('dialog').getByRole('button', { name: 'Hanya yang penting' }).click();
    await expect(page.getByLabel('Apa yang bisa kami bantu?')).toHaveValue('quotation');
    await expect(page.getByLabel('Perkiraan anggaran')).toBeVisible();
    await page.getByRole('button', { name: 'Kirim pesan' }).click();
    await expect(page.locator('form').getByRole('alert')).toContainText('Mohon periksa kolom yang ditandai.');
    await expect(page.getByText('Mohon isi nama Anda.')).toBeVisible();
    await expect(page.getByText('Mohon setujui kebijakan privasi agar kami bisa membalas.')).toBeVisible();
    if (DB && !CLEANUP) return; // reachable DB but no cleanup credentials: stop before writing data
    const email = `e2e+${Date.now()}@nexora-test.invalid`;
    await page.getByLabel('Nama lengkap').fill('E2E Test');
    await page.locator('#email').fill(email);
    await page.getByLabel('Ceritakan kebutuhan Anda').fill('Automated end-to-end test inquiry. Please ignore.');
    await page.getByLabel(/Saya setuju NEXORA DIGITAL menyimpan/).check();
    await page.getByRole('button', { name: 'Kirim pesan' }).click();
    if (DB && CLEANUP) {
      await expect(page.getByText('Terima kasih — pesan Anda sudah kami terima')).toBeVisible();
      const { data } = await CLEANUP.from('leads').select('id').eq('email', email);
      expect(data).toHaveLength(1);
      await CLEANUP.from('leads').delete().eq('email', email);
    }
    else await expect(page.locator('form').getByRole('alert')).toContainText(/belum terkirim|coba lagi/i); // DB unreachable → graceful error state
  });

  test('key pages have no serious accessibility violations (axe)', async ({ page }) => {
    for (const path of ['/', '/products', '/contact', '/pricing', '/auth/login']) {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).exclude('[role="dialog"]').analyze();
      const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
      const failures = serious.flatMap(({ id, nodes }) =>
        nodes.map((node) => `${path}: ${id} (${node.target.join(' ')})`),
      );
      expect(failures).toEqual([]);
    }
  });

  test('SEO: robots, sitemap, canonical', async ({ page, request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /admin');
    expect(robots).toContain('Sitemap:');
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('/products');
    expect(sitemap).not.toContain('not-a-published-product');
    await page.goto('/pricing');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/pricing$/);
  });
});
