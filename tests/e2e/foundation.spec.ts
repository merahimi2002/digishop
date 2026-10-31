import { test, expect } from '@playwright/test';
import { siteConfig } from '../../src/config/generated/site';

for (const { code, direction } of siteConfig.localization.locales) {
  test(`${code}: server content, direction, controls and mobile layout`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/${code}`);
    await expect(page.locator('html')).toHaveAttribute('lang', code);
    await expect(page.locator('html')).toHaveAttribute('dir', direction);
    await expect(page).toHaveTitle(siteConfig.brand.names[code]);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.getByRole('switch').setChecked(true);
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect
      .poll(async () =>
        page
          .locator('html')
          .evaluate((element) =>
            getComputedStyle(element).getPropertyValue('--logo-base').trim().toLowerCase(),
          ),
      )
      .toBe(siteConfig.appearance.logoColors.dark.base.toLowerCase());
    await page.screenshot({ path: `output/r01/${code}-dark-desktop.png`, fullPage: true });
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.getByRole('switch').setChecked(false);
    await expect(page.locator('html')).toHaveClass(/light/);
    await page.screenshot({ path: `output/r01/${code}-light-desktop.png`, fullPage: true });
    await page.setViewportSize({ width: 360, height: 800 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: `output/r01/${code}-light-mobile.png`, fullPage: true });
    await page.setViewportSize({ width: 320, height: 800 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.keyboard.press('Tab');
    expect(errors).toEqual([]);
  });
}

test('language switch preserves page and updates direction', async ({ page }) => {
  await page.goto('/fa');
  await page.locator('.language-picker summary').click();
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});

test('keyboard skip link moves focus to the main content', async ({ page }) => {
  await page.goto('/fa');
  // Wait for hydration, rather than sending a Tab while Next is committing the route.
  await expect(page.getByRole('switch')).toBeEnabled();
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('root chooses default, unknown locale/path return real 404, secrets stay out of HTML', async ({
  request,
}) => {
  const root = await request.get('/', { maxRedirects: 0 });
  expect(root.headers().location).toMatch(/\/fa$/);
  for (const url of ['/de', '/en/no-such-page', '/fa/no-such-page']) {
    const response = await request.get(url);
    expect(response.status(), url).toBe(404);
  }
  const response = await request.get('/fa');
  const html = await response.text();
  expect(html).toContain(siteConfig.brand.names.fa);
  expect(html).not.toContain('BETTER_AUTH_SECRET');
  expect(html).not.toContain('AI_API_KEY');
  expect(response.headers()['x-powered-by']).toBeUndefined();
});
