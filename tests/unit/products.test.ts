import { it, expect } from 'vitest';
import { productInput, moneyIrr, formatPrice } from '../../src/lib/product-input';
const translations = [
  { locale: 'fa', name: 'محصول', slug: 'محصول' },
  { locale: 'en', name: 'Product', slug: 'product' },
];
const product = {
  categoryId: '0cdb375d-a619-4331-8a15-08673e667247',
  translations,
  variants: [{ sku: 'ITEM-1', priceIrr: '9007199254740993', onHand: 2 }],
};
it('keeps money exact through BigInt range and rejects coercion, decimal and overflow', () => {
  expect(productInput.parse(product).variants[0]!.priceIrr).toBe('9007199254740993');
  expect(moneyIrr.parse('9223372036854775807')).toBe('9223372036854775807');
  for (const value of ['9223372036854775808', '-1', '1.5', '01', '1e5', 100, '', ' 1'])
    expect(moneyIrr.safeParse(value).success).toBe(false);
  expect(formatPrice('9007199254740993', 'en')).toBe('900,719,925,474,099.3');
  expect(formatPrice('101', 'fa')).toBe('۱۰٫۱');
});
it('requires bilingual slugs, valid stock and a positively priced active publication', () => {
  expect(productInput.safeParse({ ...product, translations: [translations[0]] }).success).toBe(
    false,
  );
  expect(
    productInput.safeParse({ ...product, variants: [{ ...product.variants[0], onHand: -1 }] })
      .success,
  ).toBe(false);
  for (const patch of [{ priceIrr: '0' }, { active: false }])
    expect(
      productInput.safeParse({
        ...product,
        status: 'PUBLISHED',
        variants: [{ ...product.variants[0], ...patch }],
      }).success,
    ).toBe(false);
});
it('rejects duplicate SKUs, incomplete or duplicate combinations and unknown selections', () => {
  expect(
    productInput.safeParse({ ...product, variants: [...product.variants, ...product.variants] })
      .success,
  ).toBe(false);
  const options = [{ code: 'color', translations, values: [{ code: 'black', translations }] }];
  expect(productInput.safeParse({ ...product, options }).success).toBe(false);
  expect(
    productInput.safeParse({
      ...product,
      options,
      variants: [{ ...product.variants[0], selections: [{ option: 'color', value: 'missing' }] }],
    }).success,
  ).toBe(false);
});
