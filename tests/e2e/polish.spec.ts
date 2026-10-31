import { test, expect } from '@playwright/test';
for (const locale of ['fa', 'en'])
  test(`${locale}: tablet composition keeps copy clear of product and indicates current page`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${locale}`);
    await expect(page.locator('.storefront')).toHaveAttribute('data-motion', 'reduced');
    const text = (await page.locator('.hero-description').boundingBox())!;
    const photo = (await page.locator('.hero-photo').boundingBox())!;
    if (locale === 'fa') expect(text.x).toBeGreaterThan(photo.x + photo.width);
    else expect(text.x + text.width).toBeLessThan(photo.x);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.locator('.hero-actions a')).toHaveCount(1);
    await page.screenshot({
      path: `output/taste-review/${locale}-tablet-light.png`,
      fullPage: true,
      caret: 'initial',
    });
    await page.getByRole('switch').setChecked(true);
    await page.screenshot({
      path: `output/taste-review/${locale}-tablet-dark.png`,
      fullPage: true,
      caret: 'initial',
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.language-picker summary').click();
    const panel = (await page.locator('.language-picker nav').boundingBox())!;
    expect(panel.x).toBeGreaterThanOrEqual(390 * 0.05 - 1);
    expect(panel.x + panel.width).toBeLessThanOrEqual(390 * 0.95 + 1);
    await page.keyboard.press('Escape');
    await page.goto(`/${locale}/products/keyboard`);
    await expect(page.locator('.desktop-nav a[aria-current=page]')).toHaveAttribute(
      'href',
      `/${locale}/collection`,
    );
  });
