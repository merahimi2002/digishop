import { z } from 'zod';
import { catalogInput } from './catalog-input';
const code = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const translations = catalogInput.shape.translations;
export const moneyIrr = z
  .string()
  .regex(/^(0|[1-9][0-9]{0,18})$/)
  .refine((v) => /^(0|[1-9][0-9]{0,18})$/.test(v) && BigInt(v) <= 9223372036854775807n);
export const productInput = z
  .object({
    categoryId: z.uuid(),
    brandId: z.uuid().nullable().default(null),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
    isDemo: z.boolean().default(false),
    translations,
    options: z
      .array(
        z.object({
          code,
          translations,
          values: z.array(z.object({ code, translations })).min(1).max(40),
        }),
      )
      .max(3)
      .default([]),
    variants: z
      .array(
        z.object({
          id: z.uuid().optional(),
          sku: z
            .string()
            .trim()
            .toUpperCase()
            .min(1)
            .max(80)
            .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/),
          priceIrr: moneyIrr,
          active: z.boolean().default(true),
          onHand: z.number().int().min(0).max(2147483647),
          selections: z
            .array(z.object({ option: code, value: code }))
            .max(3)
            .default([]),
        }),
      )
      .min(1)
      .max(100),
  })
  .superRefine((v, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (v.translations.some((t) => !t.slug)) issue('Missing slug');
    if (new Set(v.options.map((o) => o.code)).size !== v.options.length) issue('Duplicate option');
    for (const o of v.options)
      if (new Set(o.values.map((x) => x.code)).size !== o.values.length) issue('Duplicate value');
    if (new Set(v.variants.map((x) => x.sku)).size !== v.variants.length) issue('Duplicate SKU');
    const ids = v.variants.flatMap((x) => (x.id ? [x.id] : []));
    if (new Set(ids).size !== ids.length) issue('Duplicate variant id');
    const keys = new Set<string>();
    for (const variant of v.variants) {
      if (
        variant.selections.length !== v.options.length ||
        new Set(variant.selections.map((s) => s.option)).size !== variant.selections.length
      )
        issue('Incomplete combination');
      for (const s of variant.selections)
        if (!v.options.find((o) => o.code === s.option)?.values.some((x) => x.code === s.value))
          issue('Unknown selection');
      const key = [...variant.selections]
        .sort((a, b) => a.option.localeCompare(b.option))
        .map((s) => `${s.option}=${s.value}`)
        .join(',');
      if (keys.has(key)) issue('Duplicate combination');
      keys.add(key);
    }
    if (
      v.status === 'PUBLISHED' &&
      (!v.variants.some((x) => x.active) || v.variants.some((x) => x.active && x.priceIrr === '0'))
    )
      issue('Publication requires positive prices on every active variant');
  });
export type ProductInput = z.infer<typeof productInput>;
export type ProductItem = Omit<ProductInput, 'variants'> & {
  id: string;
  revision: string;
  variants: (ProductInput['variants'][number] & {
    id: string;
    reserved: number;
    inventoryVersion: number;
  })[];
};
export type ProductList = {
  items: ProductItem[];
  total: number;
  page: number;
  pages: number;
  categories: { id: string; code: string; translations: { locale: string; name: string }[] }[];
  brands: { id: string; code: string; translations: { locale: string; name: string }[] }[];
};
export function formatPrice(irr: string, locale: string) {
  const amount = BigInt(irr);
  const whole = new Intl.NumberFormat(locale).format(amount / 10n);
  return amount % 10n
    ? `${whole}${locale === 'fa' ? '٫' : '.'}${new Intl.NumberFormat(locale).format(amount % 10n)}`
    : whole;
}
