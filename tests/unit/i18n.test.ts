import { describe, expect, it } from 'vitest';
import { validateMessageSets } from '../../src/i18n/message-validation';
import fa from '../../messages/fa.json';
import en from '../../messages/en.json';

describe('translation contracts', () => {
  it('validates the real Persian and English catalogs', () => {
    expect(validateMessageSets({ fa, en }, 'fa')).toBeGreaterThan(0);
  });
  it('rejects missing keys and invalid ICU syntax', () => {
    expect(() => validateMessageSets({ fa: { title: 'a' }, en: {} }, 'fa')).toThrow('key mismatch');
    expect(() => validateMessageSets({ fa: { title: '{name' } }, 'fa')).toThrow();
  });
  it('rejects missing interpolation parameters', () => {
    expect(() =>
      validateMessageSets({ fa: { title: '{name}' }, en: { title: 'hello' } }, 'fa'),
    ).toThrow('parameter mismatch');
  });
});
