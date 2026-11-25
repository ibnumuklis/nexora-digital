import { expect, test } from '@playwright/test';

test('mobile navigation, no horizontal overflow', async ({ page }) => {
  for (const path of ['/', '/products', '/contact', '/pricing', '/auth/login']) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(1);
  }
  await page.goto('/');
  await page.getByRole('button', { name: 'Buka menu' }).click();
  await page.getByRole('navigation', { name: 'Menu seluler' }).getByRole('link', { name: 'Harga' }).click();
  await expect(page).toHaveURL(/\/pricing$/, { timeout: 45_000 });
});
