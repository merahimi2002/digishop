import { it, expect } from 'vitest';
import { validateEnvironment } from '../../src/config/env-schema';
import { can } from '../../src/server/auth/policy';
import { authFormSchema, emailInput } from '../../src/lib/auth-input';
it('normalizes email and validates multilingual form fields', () => {
  expect(emailInput.parse(' Member@Example.test ')).toBe('member@example.test');
  expect(
    authFormSchema('sign-up').safeParse({
      name: 'نام آزمایشی',
      email: 'member@example.test',
      password: 'long-passphrase-42',
      confirmation: 'long-passphrase-42',
    }).success,
  ).toBe(true);
  expect(
    authFormSchema('reset').safeParse({
      name: '',
      email: '',
      password: 'short',
      confirmation: 'short',
    }).success,
  ).toBe(false);
});
it('keeps role permissions explicit', () => {
  expect(can('CUSTOMER', 'catalog:write')).toBe(false);
  expect(can('OWNER', 'roles:manage')).toBe(true);
  expect(can('ADMIN', 'roles:manage')).toBe(false);
  expect(can('unexpected', 'account:read')).toBe(false);
});
it('disallows local delivery in production auth', () => {
  expect(() =>
    validateEnvironment({
      APP_ENV: 'production',
      APP_ORIGIN: 'https://shop.example.test',
      AUTH_ENABLED: 'true',
      DATABASE_URL: 'postgresql://localhost/shop',
      BETTER_AUTH_SECRET: 'x'.repeat(64),
      AUTH_EMAIL_TRANSPORT: 'local',
    }),
  ).toThrow('AUTH_EMAIL_TRANSPORT');
});
