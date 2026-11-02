import type { Prisma, PrismaClient } from '../../generated/prisma/client';
import { z } from 'zod';
export const storefrontQuery = z.object({
  q: z.string().trim().max(100).default(''),
  category: z.string().max(80).default(''),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
const publicInclude = {
  translations: true,
  category: { include: { translations: true } },
  brand: { include: { translations: true } },
  options: {
    orderBy: { code: 'asc' },
    include: {
      translations: true,
      values: { orderBy: { code: 'asc' }, include: { translations: true } },
    },
  },
  variants: {
    where: { active: true },
    orderBy: [{ priceIrr: 'asc' }, { sku: 'asc' }],
    include: { inventory: true, selections: { include: { option: true, value: true } } },
  },
} as const satisfies Prisma.ProductInclude;
type Row = Prisma.ProductGetPayload<{ include: typeof publicInclude }>;
function publicDto(row: Row, locale: string) {
  const t = row.translations.find((t) => t.locale === locale)!;
  return {
    id: row.id,
    name: t.name,
    slug: t.slug,
    description: t.description ?? '',
    isDemo: row.isDemo,
    localizedSlugs: Object.fromEntries(row.translations.map((t) => [t.locale, t.slug])),
    category: row.category.translations.find((t) => t.locale === locale)?.name ?? row.category.code,
    brand: row.brand?.translations.find((t) => t.locale === locale)?.name ?? '',
    options: row.options.map((o) => ({
      code: o.code,
      name: o.translations.find((t) => t.locale === locale)?.name ?? o.code,
      values: o.values.map((v) => ({
        code: v.code,
        name: v.translations.find((t) => t.locale === locale)?.label ?? v.code,
      })),
    })),
    variants: row.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      priceIrr: v.priceIrr.toString(),
      available: (v.inventory?.onHand ?? 0) - (v.inventory?.reserved ?? 0),
      selections: v.selections.map((s) => ({ option: s.option.code, value: s.value.code })),
    })),
  };
}
export type StoreProduct = ReturnType<typeof publicDto>;
const visible = (locale: string): Prisma.ProductWhereInput => ({
  status: 'PUBLISHED',
  translations: { some: { locale } },
  variants: { some: { active: true } },
});
export async function readStorefront(
  db: PrismaClient,
  locale: string,
  query: z.infer<typeof storefrontQuery>,
) {
  const where: Prisma.ProductWhereInput = {
    ...visible(locale),
    ...(query.category ? { category: { code: query.category } } : {}),
    ...(query.q
      ? {
          AND: [
            {
              translations: { some: { locale, name: { contains: query.q, mode: 'insensitive' } } },
            },
          ],
        }
      : {}),
  };
  return db.$transaction(
    async (tx) => {
      const rows = await tx.product.findMany({
        where,
        include: publicInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        take: 12,
        skip: (query.page - 1) * 12,
      });
      const total = await tx.product.count({ where });
      const categories = await tx.category.findMany({
        where: { products: { some: visible(locale) } },
        include: { translations: { where: { locale } } },
        orderBy: { code: 'asc' },
      });
      return {
        items: rows.map((r) => publicDto(r, locale)),
        total,
        pages: Math.max(1, Math.ceil(total / 12)),
        categories: categories.map((c) => ({
          code: c.code,
          name: c.translations[0]?.name ?? c.code,
        })),
      };
    },
    { isolationLevel: 'RepeatableRead' },
  );
}
export async function readStoreProduct(db: PrismaClient, locale: string, slug: string) {
  const row = await db.product.findFirst({
    where: { ...visible(locale), translations: { some: { locale, slug } } },
    include: publicInclude,
  });
  return row ? publicDto(row, locale) : null;
}
/** Minimal pre-stream check: preserve a true HTTP 404 without fetching full product content. */
export async function resolveStoreProductRoute(db: PrismaClient, locale: string, slug: string) {
  const exact = await db.productTranslation.findUnique({
    where: { locale_slug: { locale, slug } },
    select: {
      slug: true,
      product: {
        select: {
          status: true,
          variants: { where: { active: true }, take: 1, select: { id: true } },
        },
      },
    },
  });
  if (exact)
    return exact.product.status === 'PUBLISHED' && exact.product.variants.length
      ? exact.slug
      : null;
  const translated = await db.product.findFirst({
    where: { ...visible(locale), AND: [{ translations: { some: { slug } } }] },
    select: { translations: { where: { locale }, select: { slug: true } } },
    orderBy: { id: 'asc' },
  });
  return translated?.translations[0]?.slug ?? null;
}
