import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

for (const locale of ['fa', 'en'] as const) {
  test(`${locale}: standalone pages accessibility`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const route of ['/collection', '/categories', '/about', '/preview/products/headphones']) {
      await page.goto(`/${locale}${route}`);
      for (const mode of ['light', 'dark'] as const) {
        const name =
          locale === 'fa'
            ? mode === 'light'
              ? 'روشن'
              : 'تاریک'
            : mode === 'light'
              ? 'Light'
              : 'Dark';
        await page.getByRole('switch').setChecked(name === 'تاریک' || name === 'Dark');
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(
          result.violations.map(({ id, nodes }) => ({
            id,
            targets: nodes.map(({ target }) => target),
          })),
          `${locale}${route}:${mode}`,
        ).toEqual([]);
      }
    }
  });
  test(`${locale}: storefront accessibility in both themes and product dialog`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${locale}`);
    for (const mode of ['light', 'dark'] as const) {
      const name =
        locale === 'fa'
          ? mode === 'light'
            ? 'روشن'
            : 'تاریک'
          : mode === 'light'
            ? 'Light'
            : 'Dark';
      await page.getByRole('switch').setChecked(name === 'تاریک' || name === 'Dark');
      await page.evaluate(() => document.fonts.ready);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        result.violations.map(({ id, nodes }) => ({
          id,
          elements: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
        })),
      ).toEqual([]);
    }
    await page.locator('.quick-preview').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      result.violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map(({ target }) => target),
      })),
    ).toEqual([]);
  });
}
