import { describe, expect, it } from 'vitest';
import { validateEnvironment } from '../../src/config/env-schema';

describe('environment validation', () => {
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
