import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createDatabaseClient } from '../../src/server/database/factory';
const db = createDatabaseClient(process.env.DATABASE_URL!);
const tags: string[] = [];
test.afterAll(async () => {
  await db.categoryAttribute.deleteMany({ where: { attribute: { code: { in: tags } } } });
  await db.attribute.deleteMany({ where: { code: { in: tags } } });
  await db.category.deleteMany({ where: { code: { in: tags } } });
  await db.productBrand.deleteMany({ where: { code: { in: tags } } });
  const users = await db.user.findMany({
    where: { email: { in: tags.map((t) => t + '@example.test') } },
    select: { id: true },
  });
  await db.verification.deleteMany({ where: { value: { in: users.map((u) => u.id) } } });
  await db.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
  await db.$disconnect();
});
for (const locale of ['fa', 'en'])
  test(`${locale}: catalogue category, brand and typed attribute editor`, async ({
    page,
    baseURL,
  }) => {
    const tag = 'browser-taxonomy-' + randomUUID().slice(0, 8),
      email = tag + '@example.test',
      password = 'Catalogue-browser-fixture-42';
    tags.push(tag);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await page.request.post('/api/auth/sign-up/email', {
      headers: { Origin: new URL(baseURL!).origin },
      data: { name: 'Catalogue fixture', email, password },
    });
    // Fixtures alone are promoted out of band; public registration never accepts a role.
    await db.user.update({ where: { email }, data: { emailVerified: true, role: 'ADMIN' } });
    await page.goto(`/${locale}/auth/sign-in`);
    await page.locator('#auth-email').fill(email);
    await page.locator('#auth-password').fill(password);
    await page.locator('.auth-submit').click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/account$`));
    await page.goto(`/${locale}/admin`);
    await expect(page.locator('.catalog-list-heading')).toBeVisible();
    async function save() {
      const [response] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/api/admin/catalog/') && r.request().method() !== 'GET',
        ),
        page.locator('.catalog-save').click(),
      ]);
      expect(response.ok()).toBe(true);
      await expect(page.locator('.catalog-save')).toBeEnabled();
    }
    await page.locator('#catalog-code').fill(tag);
    await page.locator('#catalog-name-fa').fill('دسته سخت‌افزار آزمایشی');
    await page.locator('#catalog-name-en').fill('Hardware fixture');
    await page.locator('#catalog-slug-fa').fill('سخت‌افزار-' + tag);
    await page.locator('#catalog-slug-en').fill(tag);
    await save();
    await expect(page.locator('.catalog-notice')).toBeVisible();
    await page.locator('#catalog-search').fill(tag);
    await page.locator('.catalog-search button').click();
    await expect(page.locator('.catalog-rows li')).toHaveCount(1);
    await page.locator('.catalog-rows button').click();
    await page.locator('#catalog-name-en').fill('Updated hardware fixture');
    await save();
    await expect(page.locator('#catalog-name-en')).toHaveValue('Updated hardware fixture');
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
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
      await page.evaluate(() => {
        (document.activeElement as HTMLElement)?.blur();
        window.scrollTo(0, 0);
      });
      await expect(page.locator('h1')).toBeVisible();
      await page.screenshot({ path: `output/r05/${locale}-catalog-${width}.png`, fullPage: true });
      if (process.env.DESIGN_SKILL_ROOT) {
        const skill = process.env.DESIGN_SKILL_ROOT;
        const probes = await import(pathToFileURL(skill + '/scripts/lib/probe.mjs').href);
        const rules = await import(pathToFileURL(skill + '/scripts/lib/rules.mjs').href);
        const measurements = await page.evaluate(probes.probe),
          app = await page.evaluate(probes.app);
        const findings = rules.judgeApp(app, measurements, { width });
        await mkdir('output/r05', { recursive: true });
        await writeFile(
          `output/r05/${locale}-inspection-${width}.json`,
          JSON.stringify({ measurements, app, findings }, null, 2),
        );
      }
    }
    await page.locator('.catalog-tabs button').nth(1).click();
    await page.locator('#catalog-code').fill(tag);
    await page.locator('#catalog-name-fa').fill('برند آزمایشی');
    await page.locator('#catalog-name-en').fill('Hardware brand fixture');
    await save();
    await expect(page.locator('#catalog-code')).toHaveValue(tag);
    await page.locator('.catalog-tabs button').nth(2).click();
    await page.locator('#catalog-code').fill(tag);
    await page.locator('#catalog-kind').selectOption('OPTION');
    await page.locator('#catalog-name-fa').fill('نوع اتصال');
    await page.locator('#catalog-name-en').fill('Connection');
    const category = await db.category.findUniqueOrThrow({ where: { code: tag } });
    await page.locator(`.catalog-categories input[value="${category.id}"]`).check();
    await page.locator('.catalog-choices > button').click();
    await page.locator('#choice-0-code').fill('usb-c');
    await page.locator('#choice-0-fa').fill('یو‌اس‌بی سی');
    await page.locator('#choice-0-en').fill('USB-C');
    await save();
    await expect(page.locator('#catalog-kind')).toBeDisabled();
    await expect(page.locator('#choice-0-en')).toHaveValue('USB-C');
    const saved = await db.attribute.findUniqueOrThrow({
      where: { code: tag },
      include: { choices: { include: { translations: true } }, categories: true },
    });
    expect(saved.categories).toHaveLength(1);
    expect(saved.choices[0]!.translations).toHaveLength(2);
    expect(errors).toEqual([]);
  });
