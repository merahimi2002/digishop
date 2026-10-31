import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
test('90 percent containers, system default, toggle and persistent color palettes', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/fa');
  await expect(page.getByRole('switch')).toBeEnabled();
  await expect(page.getByRole('switch')).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'system');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.getByRole('switch')).not.toBeChecked();
  await expect(page.getByText('خودکار', { exact: true })).toHaveCount(0);
  for (const width of [320, 390, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect((await page.locator('.header-main').boundingBox())!.width).toBeCloseTo(width * 0.9, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const [id, label] of [
    ['original', 'سرمه‌ای و سبز'],
    ['violet', 'بنفش'],
    ['ocean', 'آبی اقیانوسی'],
    ['rose', 'رز'],
  ]) {
    await page.locator('.palette-picker summary').click();
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-palette', id!);
    for (const dark of [false, true]) {
      await page.getByRole('switch').setChecked(dark);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
      ).toEqual([]);
    }
  }
  await page.reload();
  await expect(page.getByRole('switch')).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'rose');
  await page.locator('.palette-picker summary').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.palette-picker summary')).toBeFocused();
  await page.screenshot({
    path: 'output/r02-v3/desktop-rose-dark.png',
    fullPage: true,
    caret: 'initial',
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('switch').setChecked(false);
  await page.screenshot({
    path: 'output/r02-v3/mobile-rose-light.png',
    fullPage: true,
    caret: 'initial',
  });
  expect(errors).toEqual([]);
});
