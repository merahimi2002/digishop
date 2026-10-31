import { test, expect } from '@playwright/test';
test('signature titles, icons inside toggle, transition and smooth wheel', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/fa');
  await expect(page.locator('.storefront')).toHaveAttribute('data-motion', 'gsap');
  await expect(page.locator('html')).toHaveClass(/lenis/);
  await expect(page.locator('.theme-toggle > svg')).toHaveCount(0);
  await expect(page.locator('.toggle-track svg')).toHaveCount(2);
  await page.getByRole('switch').setChecked(true);
  await expect(page.locator('html')).toHaveClass(/theme-transition/);
  await expect(page.locator('html')).not.toHaveClass(/theme-transition/);
  expect(
    parseFloat(await page.locator('#hero-title').evaluate((el) => getComputedStyle(el).fontSize)),
  ).toBeLessThanOrEqual(48);
  await expect(page.locator('#hero-title .signature-signal span')).toHaveCount(3);
  await page.mouse.move(700, 600);
  await page.mouse.wheel(0, 650);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(600);
  await page.mouse.wheel(0, -650);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(10);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  await page.getByRole('switch').setChecked(false);
  await expect(page.locator('html')).not.toHaveClass(/theme-transition/);
  await page.screenshot({
    path: 'output/r02-v4/fa-heading-light.png',
    fullPage: true,
    caret: 'initial',
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('switch').setChecked(true);
  await page.screenshot({
    path: 'output/r02-v4/fa-heading-mobile-dark.png',
    fullPage: true,
    caret: 'initial',
  });
  await page.goto('/en/about');
  await expect(page.locator('h1.signature-heading')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  expect(errors).toEqual([]);
});
