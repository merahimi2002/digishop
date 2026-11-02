import { test, expect } from '@playwright/test';

for (const locale of ['fa', 'en'] as const) {
  test(`${locale}: independent pages, product links, flag menu and query retention`, async ({
    page,
    request,
  }) => {
    const errors: string[] = [];
    await page.emulateMedia({ reducedMotion: 'reduce' });
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    for (const route of [
      '/collection',
      '/categories',
      '/about',
      '/preview/products/headphones',
      '/preview/products/keyboard',
      '/preview/products/mouse',
    ]) {
      const response = await request.get(`/${locale}${route}`);
      expect(response.status()).toBe(200);
      await page.goto(`/${locale}${route}`);
      await expect(page.locator('.storefront')).toHaveAttribute('data-motion', 'reduced');
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('.desktop-nav a[aria-current=page]')).toHaveCount(1);
      await expect(page.locator('header.store-header')).toHaveCount(1);
      await expect(page.locator('footer.store-footer')).toHaveCount(1);
      if (['/collection', '/about', '/preview/products/headphones'].includes(route)) {
        await page.screenshot({
          path: `output/r02-v2/${locale}-${route.replaceAll('/', '-').slice(1)}.png`,
          fullPage: true,
          animations: 'disabled',
          caret: 'initial',
        });
      }
    }
    await page.goto(`/${locale}/collection?category=workspace`);
    await expect(page.locator('.store-filters select')).toHaveValue('');
    await page.locator('.language-picker summary').click();
    await expect(page.locator('.language-picker nav .locale-flag')).toHaveCount(2);
    await page
      .getByRole('link', { name: locale === 'fa' ? 'English' : 'فارسی', exact: true })
      .click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === `/${locale === 'fa' ? 'en' : 'fa'}/collection` &&
        url.searchParams.get('category') === 'workspace',
    );
    await expect(page.locator('.store-filters')).toBeVisible();
    await page.goto(`/${locale === 'fa' ? 'en' : 'fa'}/preview/products/keyboard`);
    await page.locator('.language-picker summary').click();
    await page
      .getByRole('link', { name: locale === 'fa' ? 'فارسی' : 'English', exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/preview/products/keyboard$`));
    await page.locator('.brand-link').first().click();
    await expect(page).toHaveURL(new RegExp(`/${locale}$`));
    expect((await request.get(`/${locale}/products/missing-item`)).status()).toBe(404);
    expect(errors).toEqual([]);
  });
}

test('compact navy hero and reversible GSAP scrolling with reduced-motion cleanup', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/fa');
  await expect(page.locator('.storefront')).toHaveAttribute('data-motion', 'gsap');
  const hero = page.locator('.shop-hero');
  expect((await hero.boundingBox())!.width).toBeCloseTo(1440 * 0.9, 0);
  await expect(hero).toHaveCSS('background-color', 'rgb(11, 31, 58)');
  const image = page.locator('.hero-photo img');
  const initial = await image.evaluate((element) => getComputedStyle(element).transform);
  await page.evaluate(() => window.scrollTo({ top: 380, behavior: 'instant' }));
  await expect
    .poll(() => image.evaluate((element) => getComputedStyle(element).transform))
    .not.toBe(initial);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect
    .poll(() => image.evaluate((element) => getComputedStyle(element).transform))
    .toBe(initial);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.storefront')).toHaveAttribute('data-motion', 'reduced');
  await expect(image).toHaveCSS('transform', 'none');
  await page.screenshot({
    path: 'output/r02-v2/fa-home.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('switch').setChecked(true);
  await page.screenshot({
    path: 'output/r02-v2/fa-home-mobile-dark.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.locator('.language-picker summary').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.language-picker')).not.toHaveAttribute('open', '');
  await expect(page.locator('.language-picker summary')).toBeFocused();
});
