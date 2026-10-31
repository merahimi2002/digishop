import { test, expect } from '@playwright/test';

test('theme and locale navigation do not produce React console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/fa');
  await page.getByRole('switch').setChecked(true);
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.locator('.language-picker summary').click();
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByRole('switch').setChecked(false);
  await expect(page.locator('html')).toHaveClass(/light/);
  await page.locator('.language-picker summary').click();
  await page.getByRole('link', { name: 'فارسی', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
  await expect(page.locator('html')).toHaveClass(/light/);
  await page.evaluate(() => localStorage.removeItem('theme'));
  await page.reload();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveClass(/light/);
  await page.reload();
  await expect(page.getByRole('switch')).toBeEnabled();
  await expect(page.locator('html')).toHaveClass(/light/);
  expect(errors).toEqual([]);
});

test('theme choice syncs between tabs', async ({ context, page }) => {
  await page.goto('/fa');
  const second = await context.newPage();
  await second.goto('/en');
  await page.getByRole('switch').setChecked(true);
  await expect(second.locator('html')).toHaveClass(/dark/);
  await second.getByRole('switch').setChecked(false);
  await expect(page.locator('html')).toHaveClass(/light/);
  await second.close();
});

test('theme controls and locale switch still work when theme storage is blocked', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const originalGet = Storage.prototype.getItem;
    const originalSet = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === 'theme') throw new DOMException('Blocked theme storage', 'SecurityError');
      return originalGet.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === 'theme') throw new DOMException('Blocked theme storage', 'SecurityError');
      originalSet.call(this, key, value);
    };
  });
  await page.goto('/fa');
  await page.getByRole('switch').setChecked(true);
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.locator('.language-picker summary').click();
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByRole('switch').setChecked(false);
  await expect(page.locator('html')).toHaveClass(/light/);
  expect(errors).toEqual([]);
});
