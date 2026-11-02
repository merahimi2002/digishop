import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createDatabaseClient } from '../../src/server/database/factory';
import { cleanupCatalogFixtures } from '../catalog-cleanup';
const db = createDatabaseClient(process.env.DATABASE_URL!);
const tags: string[] = [];
test.afterAll(async () => {
  const categories = await db.category.findMany({ where: { code: { in: tags } } });
  await cleanupCatalogFixtures(
    (await db.product.findMany({ where: { categoryId: { in: categories.map((c) => c.id) } } })).map(
      (p) => p.id,
    ),
  );
  await db.category.deleteMany({ where: { code: { in: tags } } });
  const users = await db.user.findMany({
    where: { email: { in: tags.map((t) => t + '@example.test') } },
  });
  await db.verification.deleteMany({ where: { value: { in: users.map((u) => u.id) } } });
  await db.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
  await db.$disconnect();
});
for (const locale of ['fa', 'en'] as const)
  test(`${locale}: create variants, publish to storefront, update and archive`, async ({
    page,
    baseURL,
  }) => {
    test.setTimeout(120000);
    const tag = 'browser-products-' + randomUUID().slice(0, 8);
    const faName = 'محصول آزمایشی ' + tag.slice(-8),
      enName = 'Product fixture ' + tag.slice(-8);
    tags.push(tag);
    const email = tag + '@example.test',
      password = 'Product-browser-fixture-42';
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    const category = await db.category.create({
      data: {
        code: tag,
        translations: {
          create: [
            { locale: 'fa', name: 'سخت‌افزار آزمایشی', slug: tag + '-fa' },
            { locale: 'en', name: 'Hardware fixture', slug: tag + '-en' },
          ],
        },
      },
    });
    const signup = await page.request.post('/api/auth/sign-up/email', {
      headers: { Origin: new URL(baseURL!).origin },
      data: { name: 'Product fixture', email, password },
    });
    expect(signup.ok()).toBe(true);
    await db.user.update({ where: { email }, data: { role: 'ADMIN', emailVerified: true } });
    await page.goto(`/${locale}/auth/sign-in`);
    await page.locator('#auth-email').fill(email);
    await page.locator('#auth-password').fill(password);
    await page.locator('.auth-submit').click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/account$`));
    await page.goto(`/${locale}/admin/products`);
    await expect(page.locator('main h1')).toBeVisible();
    await page.locator('.product-basic-fields select').first().selectOption(category.id);
    const localized = async (
      root: ReturnType<typeof page.locator>,
      fa: string,
      en: string,
      slugs = false,
    ) => {
      for (const [lang, name] of [
        ['fa', fa],
        ['en', en],
      ]) {
        const fields = root.locator(`fieldset[dir=${lang === 'fa' ? 'rtl' : 'ltr'}]`);
        await expect(fields).toHaveCount(1);
        await fields.locator('input').first().fill(name!);
        if (slugs) {
          await fields.locator('input').nth(1).fill(`${tag}-${lang}`);
          await fields
            .locator('textarea')
            .fill(lang === 'fa' ? 'محتوای آزمایشی محصول' : 'Product fixture description');
        }
      }
    };
    await localized(
      page.locator('.product-editor > fieldset > .product-locales'),
      faName,
      enName,
      true,
    );
    await page
      .getByRole('button', { name: locale === 'fa' ? 'افزودن گزینه' : 'Add option', exact: true })
      .click();
    const option = page.locator('.product-option');
    await option.locator(':scope > label input').fill('color');
    await localized(option.locator(':scope > .product-locales'), 'رنگ', 'Color');
    const value = option.locator('.product-option-value').first();
    await value.locator(':scope > label input').fill('black');
    await localized(value.locator('.product-locales'), 'مشکی', 'Black');
    await option
      .getByRole('button', { name: locale === 'fa' ? 'افزودن مقدار' : 'Add value' })
      .click();
    const second = option.locator('.product-option-value').nth(1);
    await second.locator(':scope > label input').fill('white');
    await localized(second.locator('.product-locales'), 'سفید', 'White');
    const fillVariant = async (i: number, value: string, price: string, stock: string) => {
      const row = page.locator('.product-variant').nth(i);
      await row
        .locator('input')
        .nth(0)
        .fill(tag + '-' + value);
      await row.locator('input').nth(1).fill(price);
      await row.locator('input').nth(2).fill(stock);
      await row.locator('select').selectOption(value);
    };
    await fillVariant(0, 'black', '1001', '5');
    await page
      .getByRole('button', { name: locale === 'fa' ? 'افزودن تنوع' : 'Add variant', exact: true })
      .click();
    await fillVariant(1, 'white', '2000', '0');
    async function save() {
      const [response] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().endsWith('/api/admin/catalog/products') &&
            ['POST', 'PATCH'].includes(r.request().method()),
        ),
        page.locator('.product-save button').click(),
      ]);
      expect(response.ok()).toBe(true);
      await expect(page.locator('.product-save button')).toBeDisabled();
      return (await response.json()).item;
    }
    await page.locator('.product-publish input[type=checkbox]').check();
    let product = await save();
    expect((await page.request.get(`/${locale}/products/${tag}-${locale}`)).status()).toBe(404);
    await page.locator('.product-publish select').selectOption('PUBLISHED');
    product = await save();
    await mkdir('output/r05-products', { recursive: true });
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      for (const dark of [false, true]) {
        await page.getByRole('switch').setChecked(dark);
        await expect(page.locator('html')).not.toHaveClass(/theme-transition/);
        const axe = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(
          axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
        ).toEqual([]);
      }
      await page.evaluate(() => {
        (document.activeElement as HTMLElement)?.blur();
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
      await page.screenshot({
        path: `output/r05-products/${locale}-admin-${width}.png`,
        fullPage: true,
      });
      if (process.env.DESIGN_SKILL_ROOT) {
        const skill = process.env.DESIGN_SKILL_ROOT;
        const probes = await import(pathToFileURL(skill + '/scripts/lib/probe.mjs').href);
        const rules = await import(pathToFileURL(skill + '/scripts/lib/rules.mjs').href);
        const measurements = await page.evaluate(probes.probe),
          app = await page.evaluate(probes.app);
        const findings = rules.judgeApp(app, measurements, { width });
        await writeFile(
          `output/r05-products/${locale}-inspection-${width}.json`,
          JSON.stringify({ measurements, app, findings }, null, 2),
        );
      }
    }
    // Extend an already-saved option without replacing any existing variant.
    await option
      .getByRole('button', { name: locale === 'fa' ? 'افزودن مقدار' : 'Add value' })
      .click();
    const blue = option.locator('.product-option-value').nth(2);
    await blue.locator(':scope > label input').fill('blue');
    await localized(blue.locator('.product-locales'), 'آبی', 'Blue');
    await page
      .getByRole('button', { name: locale === 'fa' ? 'افزودن تنوع' : 'Add variant', exact: true })
      .click();
    await fillVariant(2, 'blue', '3000', '2');
    product = await save();
    expect(product.variants).toHaveLength(3);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/collection?category=${tag}&q=${tag.slice(-8)}`);
    await expect(page.locator('.store-product-grid article')).toHaveCount(1);
    const productLink = page.getByRole('link', {
      name: locale === 'fa' ? faName : enName,
      exact: true,
    });
    await expect(productLink).toHaveCount(1);
    await productLink.click();
    await expect(page.locator('.store-variant-picker .store-price')).toHaveText(
      locale === 'fa' ? '۱۰۰٫۱ تومان' : '100.1 toman',
    );
    await page
      .locator('.store-variant-picker select')
      .selectOption(product.variants.find((v: { sku: string }) => v.sku.endsWith('WHITE')).id);
    await expect(page.locator('.store-variant-picker')).toContainText(
      locale === 'fa' ? 'ناموجود' : 'Out of stock',
    );
    await page.locator('.language-picker summary').click();
    await page
      .locator('.language-picker nav a')
      .filter({ hasText: locale === 'fa' ? 'English' : 'فارسی' })
      .click();
    const other = locale === 'fa' ? 'en' : 'fa';
    await expect(page).toHaveURL(new RegExp(`/${other}/products/${tag}-${other}$`));
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('html')).not.toHaveClass(/theme-transition/);
    await page.evaluate(() => document.fonts.ready);
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      for (const dark of [false, true]) {
        await page.getByRole('switch').setChecked(dark);
        await expect(page.locator('html')).not.toHaveClass(/theme-transition/);
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(
          result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
        ).toEqual([]);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      (document.activeElement as HTMLElement)?.blur();
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await page.screenshot({
      path: `output/r05-products/${locale}-store-mobile.png`,
      fullPage: true,
    });
    await page.goto(`/${locale}/admin/products`);
    await page
      .locator('.catalog-rows button')
      .filter({ hasText: locale === 'fa' ? faName : enName })
      .click();
    await page.locator('.product-variant input').nth(1).fill('3000');
    await page.locator('.product-variant input').nth(2).fill('7');
    await save();
    const publicPage = await page.context().newPage();
    await publicPage.goto(`/${locale}/products/${tag}-${locale}`);
    await expect(publicPage.locator('.store-price')).toHaveText(
      locale === 'fa' ? '۲۰۰ تومان' : '200 toman',
    );
    await publicPage.close();
    await page.locator('.product-publish select').selectOption('ARCHIVED');
    await save();
    expect((await page.request.get(`/${locale}/products/${tag}-${locale}`)).status()).toBe(404);
    expect(errors).toEqual([]);
  });
