import { z } from 'zod';
import { siteConfig } from '../config/generated/site';
export const catalogResources = ['categories', 'brands', 'attributes'] as const;
export type CatalogResource = (typeof catalogResources)[number];
export const catalogResource = z.enum(catalogResources);
const code = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const slug = z
  .string()
  .max(500)
  .transform((v) =>
    v
      .normalize('NFKC')
      .trim()
      .toLowerCase()
      .replace(/[\s\u200c\u200d]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, ''),
  )
  .pipe(
    z
      .string()
      .min(1)
      .max(180)
      .regex(/^[\p{L}\p{N}][\p{L}\p{M}\p{N}]*(?:-[\p{L}\p{N}][\p{L}\p{M}\p{N}]*)*$/u),
  );
const translation = z.object({
  locale: z.enum(siteConfig.localization.locales.map((l) => l.code)),
  name: z.string().trim().min(1).max(160),
  slug: slug.optional(),
  description: z.string().trim().max(4000).default(''),
});
const translations = z
  .array(translation)
  .length(siteConfig.localization.locales.length)
  .refine((rows) => new Set(rows.map((r) => r.locale)).size === rows.length);
export const catalogInput = z
  .object({
    code,
    translations,
    parentId: z.uuid().nullable().default(null),
    kind: z.enum(['TEXT', 'NUMBER', 'BOOLEAN', 'OPTION']).default('TEXT'),
    unit: z.string().trim().max(32).default(''),
    categoryIds: z.array(z.uuid()).max(500).default([]),
    choices: z
      .array(z.object({ id: z.uuid().optional(), code, translations }))
      .max(40)
      .default([]),
  })
  .superRefine((v, ctx) => {
    if (new Set(v.categoryIds).size !== v.categoryIds.length)
      ctx.addIssue({ code: 'custom', path: ['categoryIds'], message: 'Duplicate category' });
    if (new Set(v.choices.map((c) => c.code)).size !== v.choices.length)
      ctx.addIssue({ code: 'custom', path: ['choices'], message: 'Duplicate choice' });
    const ids = v.choices.flatMap((c) => (c.id ? [c.id] : []));
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: 'custom', path: ['choices'], message: 'Duplicate choice id' });
  });
export type CatalogInput = z.infer<typeof catalogInput>;
export type CatalogTranslation = z.infer<typeof translation>;
export type CatalogItem = CatalogInput & { id: string; revision: string; references: number };
export type CatalogList = {
  items: CatalogItem[];
  total: number;
  page: number;
  pages: number;
  categories: { id: string; code: string; translations: CatalogTranslation[] }[];
};
