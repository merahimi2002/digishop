import { describe, expect, it } from 'vitest';
import { validateEnvironment } from '../../src/config/env-schema';

describe('environment validation', () => {
  it('accepts only PostgreSQL and guards the owner test URL too', () => {
    expect(() => validateEnvironment({ DATABASE_URL: 'https://example.test/db' })).toThrow(
      'PostgreSQL',
    );
    expect(() =>
      validateEnvironment({ APP_ENV: 'test', DIRECT_DATABASE_URL: 'postgresql://localhost/live' }),
    ).toThrow('Test database');
  });
  it('never reflects malformed database secrets', () => {
    const secret = 'private-db-secret';
    try {
      validateEnvironment({ DATABASE_URL: 'postgresql://user:' + secret + '@[' });
    } catch (error) {
      expect(String(error)).not.toContain(secret);
      return;
    }
    throw new Error('Expected invalid URL rejection');
  });
  it('starts the foundation without optional service credentials', () => {
    expect(validateEnvironment({}).AUTH_ENABLED).toBe(false);
  });
  it('requires credentials only for enabled features', () => {
    expect(() => validateEnvironment({ AUTH_ENABLED: 'true' })).toThrow('DATABASE_URL');
    expect(() => validateEnvironment({ AI_ENABLED: 'true' })).toThrow('AI_API_KEY');
  });
  it('never reflects a secret in an error message', () => {
    try {
      validateEnvironment({ AUTH_ENABLED: 'true', BETTER_AUTH_SECRET: 'private-short-value' });
    } catch (error) {
      expect(String(error)).not.toContain('private-short-value');
      return;
    }
    throw new Error('Expected rejection');
  });
  it('requires HTTPS in production and an explicitly separate test database', () => {
    expect(() =>
      validateEnvironment({ APP_ENV: 'production', APP_ORIGIN: 'http://example.com' }),
    ).toThrow('APP_ORIGIN');
    expect(() =>
      validateEnvironment({ APP_ENV: 'test', DATABASE_URL: 'postgresql://localhost/store' }),
    ).toThrow('Test database');
    expect(
      validateEnvironment({ APP_ENV: 'test', DATABASE_URL: 'postgresql://localhost/store_test' })
        .APP_ENV,
    ).toBe('test');
  });
});
