import { it, expect } from 'vitest';
import { catalogInput } from '../../src/lib/catalog-input';
it('normalizes Persian half-spaces and English slugs while rejecting unsafe paths', () => {
  const value = {
    code: 'graphics-card',
    translations: [
      { locale: 'fa', name: 'سخت‌افزار', slug: 'سخت‌افزار پیشرفته' },
      { locale: 'en', name: 'Hardware', slug: 'Advanced Hardware' },
    ],
  };
  const parsed = catalogInput.parse(value);
  expect(parsed.translations.map((t) => t.slug)).toEqual([
    'سخت-افزار-پیشرفته',
    'advanced-hardware',
  ]);
  expect(
    catalogInput.safeParse({
      ...value,
      translations: value.translations.map((t) => ({ ...t, slug: 'unsafe/path' })),
    }).success,
  ).toBe(false);
});
