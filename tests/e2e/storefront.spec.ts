import { test, expect } from '@playwright/test';

for (const locale of ['fa', 'en'] as const) {
  test(`${locale}: storefront filters, search, dialog and keyboard focus`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/${locale}`);
    await expect(page.locator('.hero-photo img')).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator('.hero-photo img')
          .evaluate(
            (image) =>
              (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
          ),
      )
      .toBe(true);
    if (locale === 'fa') {
      await page.evaluate(() => document.fonts.load('500 16px Vazirmatn', 'سلام'));
      expect(await page.evaluate(() => document.fonts.check('500 16px Vazirmatn', 'سلام'))).toBe(
        true,
      );
      await expect(page.locator('body')).toHaveCSS('font-family', /Vazirmatn/);
    }
    await expect(page.locator('.object-card')).toHaveCount(3);
    const trigger = page.locator('.quick-preview').first();
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('.dialog-close')).toBeFocused();
    await page
      .getByRole('dialog')
      .screenshot({ path: `output/r02/${locale}-product-preview.png`, animations: 'disabled' });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await page
      .getByRole('button', { name: locale === 'fa' ? 'فضای کار' : 'Workspace', exact: true })
      .click();
    await expect(page.locator('.object-card')).toHaveCount(1);
    await page.locator('#collection-search').fill('no-match-123');
    await expect(page.locator('.collection-empty')).toBeVisible();
    await page
      .getByRole('button', {
        name: locale === 'fa' ? 'دیدن همه انتخاب‌ها' : 'Show all objects',
        exact: true,
      })
      .last()
      .click();
    await expect(page.locator('.object-card')).toHaveCount(3);
    expect(errors).toEqual([]);
  });

  test(`${locale}: responsive themes, mobile navigation and reduced motion`, async ({ page }) => {
    await page.goto(`/${locale}`);
    for (const width of [1280, 390, 360, 320]) {
      await page.setViewportSize({ width, height: 900 });
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
        await expect(page.locator('html')).toHaveClass(new RegExp(mode));
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        if (width === 1280 || width === 390)
          await page.screenshot({
            path: `output/r02/${locale}-${mode}-${width}.png`,
            fullPage: true,
            animations: 'disabled',
          });
      }
    }
    await page.locator('.mobile-menu summary').click();
    await expect(page.locator('.mobile-menu')).toHaveAttribute('open', '');
    await page.locator('.mobile-menu nav a').first().click();
    await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open', '');
    await expect(page).toHaveURL(new RegExp('/' + locale + '/collection'));
    await page.goto('/' + locale);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('.shop-hero').scrollIntoViewIfNeeded();
    await expect(page.locator('.hero-photo')).toHaveCSS('transform', 'none');
    await expect(page.locator('.hero-photo img')).toHaveCSS('animation-name', 'none');
  });
}
