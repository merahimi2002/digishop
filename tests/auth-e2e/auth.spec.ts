import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdir, readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createDatabaseClient } from '../../src/server/database/factory';
import type { AuthMail } from '../../src/server/auth/mail';
const db = createDatabaseClient(process.env.DATABASE_URL!);
const createdEmails: string[] = [];
async function findMail(email: string, kind: 'verify' | 'reset') {
  let found: AuthMail | undefined;
  await expect
    .poll(async () => {
      for (const name of (await readdir('.tools/mailbox-test')).sort().reverse()) {
        try {
          const mail = JSON.parse(
            await readFile('.tools/mailbox-test/' + name, 'utf8'),
          ) as AuthMail;
          if (mail.to === email && mail.kind === kind) {
            found = mail;
            return true;
          }
        } catch {
          /* A concurrent write is retried. */
        }
      }
      return false;
    })
    .toBe(true);
  return found!;
}
test.beforeAll(async () => {
  await db.rateLimit.deleteMany();
});
test.afterAll(async () => {
  await db.user.deleteMany({ where: { email: { in: createdEmails } } });
  await db.$disconnect();
});
for (const locale of ['fa', 'en'])
  test(`${locale}: registration, verification, account, reset and logout`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    const email = 'browser-' + randomUUID() + '@example.test',
      password = 'Browser-fixture-passphrase-42';
    createdEmails.push(email);
    await page.goto(`/${locale}/auth/sign-up`);
    await page.locator('#auth-name').fill(locale === 'fa' ? 'کاربر آزمایشی' : 'Test member');
    await page.locator('#auth-email').fill(email);
    await page.locator('#auth-password').fill(password);
    await page.locator('#auth-confirmation').fill(password);
    await page.locator('.auth-submit').click();
    await expect(page.locator('.auth-result')).toBeVisible();
    await page.goto(`/${locale}/auth/resend`);
    await page.locator('#auth-email').fill(email);
    await page.locator('.auth-submit').click();
    await expect(page.locator('.auth-result')).toBeVisible();
    await page.goto((await findMail(email, 'verify')).url);
    await expect(page.locator('.auth-submit')).toBeEnabled();
    await expect(page).not.toHaveURL(/#token=/);
    await page.locator('.auth-submit').click();
    await expect(page.locator('.auth-result')).toBeVisible();
    await page.goto(`/${locale}/auth/sign-in`);
    await page.locator('#auth-email').fill(email);
    await page.locator('#auth-password').fill(password);
    await page.locator('.auth-submit').click();
    await expect(page).toHaveURL(new RegExp('/' + locale + '/account$'));
    await expect(page.locator('.account-email')).toHaveText(email);
    await expect(page.locator('.header-account')).toHaveAttribute('href', `/${locale}/account`);
    await page.locator('#account-name').fill(locale === 'fa' ? 'نام تازه' : 'Updated member');
    await page.locator('.auth-form').first().getByRole('button').click();
    await expect(page.locator('.account-status')).not.toBeEmpty();
    expect((await page.request.get('/api/admin/access')).status()).toBe(403);
    await page.goto(`/${locale}/auth/forgot`);
    await page.locator('#auth-email').fill(email);
    await page.locator('.auth-submit').click();
    await expect(page.locator('.auth-result')).toBeVisible();
    await page.goto((await findMail(email, 'reset')).url);
    await expect(page.locator('.auth-submit')).toBeEnabled();
    await page.locator('#auth-password').fill(password + '-new');
    await page.locator('#auth-confirmation').fill(password + '-new');
    await page.locator('.auth-submit').click();
    await expect(page.locator('.auth-result')).toBeVisible();
    await page.goto(`/${locale}/account`);
    await expect(page).toHaveURL(new RegExp('/' + locale + '/auth/sign-in$'));
    await page.locator('#auth-email').fill(email);
    await page.locator('#auth-password').fill(password + '-new');
    await page.locator('.auth-submit').click();
    await expect(page).toHaveURL(new RegExp('/' + locale + '/account$'));
    await page
      .getByRole('button', { name: locale === 'fa' ? 'خروج از حساب' : 'Sign out', exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp('/' + locale + '/auth/sign-in$'));
    await page.goto(`/${locale}/account`);
    await expect(page).toHaveURL(new RegExp('/' + locale + '/auth/sign-in$'));
    expect(errors).toEqual([]);
  });
for (const locale of ['fa', 'en'])
  test(`${locale}: auth accessibility, validation and responsive themes`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/auth/sign-in`);
      await expect(page.getByRole('switch')).toBeEnabled();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.locator('.auth-submit').click();
      await expect(page.locator('[aria-invalid=true]')).toHaveCount(2);
      for (const dark of [false, true]) {
        await page.getByRole('switch').setChecked(dark);
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(
          result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
        ).toEqual([]);
      }
      if (width === 390 || width === 1280)
        await page.screenshot({
          path: `output/r04/${locale}-sign-in-${width}.png`,
          fullPage: true,
          caret: 'initial',
        });
    }
  });
