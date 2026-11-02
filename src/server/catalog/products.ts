import { createHash } from 'node:crypto';
import { Prisma, type PrismaClient } from '../../generated/prisma/client';
import { productInput, type ProductItem } from '../../lib/product-input';
import { canonicalVariantKey } from '../database/inventory';
import { CatalogError } from './service';
export const productInclude = {
  translations: { orderBy: { locale: 'asc' } },
  options: {
    orderBy: { code: 'asc' },
    include: {
      translations: { orderBy: { locale: 'asc' } },
      values: {
        orderBy: { code: 'asc' },
        include: { translations: { orderBy: { locale: 'asc' } } },
      },
    },
  },
  variants: {
    orderBy: { sku: 'asc' },
    include: {
      inventory: true,
      selections: { include: { option: true, value: true }, orderBy: { optionId: 'asc' } },
    },
  },
} as const satisfies Prisma.ProductInclude;
type Row = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
export function productDto(row: Row): ProductItem {
  const item = {
    id: row.id,
    categoryId: row.categoryId,
    brandId: row.brandId,
    status: row.status,
    isDemo: row.isDemo,
    translations: row.translations.map((t) => ({
      locale: t.locale as 'fa' | 'en',
      name: t.name,
      slug: t.slug,
      description: t.description ?? '',
    })),
    options: row.options.map((o) => ({
      code: o.code,
      translations: o.translations.map((t) => ({
        locale: t.locale as 'fa' | 'en',
        name: t.name,
        description: '',
      })),
      values: o.values.map((v) => ({
        code: v.code,
        translations: v.translations.map((t) => ({
          locale: t.locale as 'fa' | 'en',
          name: t.label,
          description: '',
        })),
      })),
    })),
    variants: row.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      priceIrr: v.priceIrr.toString(),
      active: v.active,
      onHand: v.inventory?.onHand ?? 0,
      reserved: v.inventory?.reserved ?? 0,
      inventoryVersion: v.inventory?.version ?? 0,
      selections: v.selections.map((s) => ({ option: s.option.code, value: s.value.code })),
    })),
  };
  return { ...item, revision: createHash('sha256').update(JSON.stringify(item)).digest('hex') };
}
export async function listProducts(db: PrismaClient, page = 1, q = '') {
  const where: Prisma.ProductWhereInput = q
    ? {
        OR: [
          { translations: { some: { name: { contains: q, mode: 'insensitive' } } } },
          { variants: { some: { sku: { contains: q, mode: 'insensitive' } } } },
        ],
      }
    : {};
  return db.$transaction(
    async (tx) => {
      const items = await tx.product.findMany({
        where,
        include: productInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        take: 20,
        skip: (page - 1) * 20,
      });
      const total = await tx.product.count({ where });
      const categories = await tx.category.findMany({
        include: { translations: true },
        orderBy: { code: 'asc' },
        take: 501,
      });
      const brands = await tx.productBrand.findMany({
        include: { translations: true },
        orderBy: { code: 'asc' },
        take: 501,
      });
      if (categories.length > 500 || brands.length > 500) throw new CatalogError('CATEGORY_LIMIT');
      return {
        items: items.map(productDto),
        total,
        page,
        pages: Math.max(1, Math.ceil(total / 20)),
        categories,
        brands,
      };
    },
    { isolationLevel: 'RepeatableRead' },
  );
}
export async function saveProduct(
  db: PrismaClient,
  actorId: string,
  payload: unknown,
  id?: string,
  revision?: string,
) {
  const input = productInput.parse(payload);
  return db.$transaction(
    async (tx) => {
      // Same lock as taxonomy edits: serialize catalog structure and publication checks.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(74305)`;
      const old = id
        ? await tx.product.findUnique({ where: { id }, include: productInclude })
        : null;
      if (id && !old) throw new CatalogError('NOT_FOUND', 404);
      if (old && productDto(old).revision !== revision) throw new CatalogError('STALE_EDIT');
      if (!old && input.variants.some((v) => v.id)) throw new CatalogError('INVALID_INPUT', 400);
      if (old) {
        const existing = new Set(old.variants.map((v) => v.id));
        if (
          input.variants.some((v) => v.id && !existing.has(v.id)) ||
          old.variants.some((v) => !input.variants.some((x) => x.id === v.id))
        )
          throw new CatalogError('VARIANT_IDENTITY');
        // Keep option axes and existing value codes stable; append values for new variants.
        if (
          input.options.length !== old.options.length ||
          old.options.some((o) => {
            const next = input.options.find((x) => x.code === o.code);
            return !next || o.values.some((v) => !next.values.some((x) => x.code === v.code));
          })
        )
          throw new CatalogError('OPTION_STRUCTURE');
      }
      const category = await tx.category.findUnique({
        where: { id: input.categoryId },
        include: { attributes: true },
      });
      if (!category) throw new CatalogError('INVALID_INPUT', 400);
      if (input.status === 'PUBLISHED') {
        for (const required of category.attributes.filter((a) => a.required)) {
          if (
            !old ||
            !(await tx.productAttributeValue.count({
              where: { productId: old.id, attributeId: required.attributeId },
            }))
          )
            throw new CatalogError('REQUIRED_ATTRIBUTES');
        }
      }
      const product = old
        ? await tx.product.update({
            where: { id },
            data: {
              categoryId: input.categoryId,
              brandId: input.brandId,
              status: input.status,
              isDemo: input.isDemo,
            },
          })
        : await tx.product.create({
            data: {
              categoryId: input.categoryId,
              brandId: input.brandId,
              status: input.status,
              isDemo: input.isDemo,
            },
          });
      for (const t of input.translations) {
        // Reserve historical slugs across the catalog to avoid ambiguous public redirects later.
        const history = await tx.productSlugHistory.findUnique({
          where: { locale_slug: { locale: t.locale, slug: t.slug! } },
        });
        if (history && history.productId !== product.id) throw new CatalogError('DUPLICATE');
        const previous = old?.translations.find((x) => x.locale === t.locale);
        if (previous && previous.slug !== t.slug)
          await tx.productSlugHistory.upsert({
            where: { locale_slug: { locale: t.locale, slug: previous.slug } },
            create: { productId: product.id, locale: t.locale, slug: previous.slug },
            update: {},
          });
        const data = { name: t.name, slug: t.slug!, description: t.description };
        await tx.productTranslation.upsert({
          where: { productId_locale: { productId: product.id, locale: t.locale } },
          create: { productId: product.id, locale: t.locale, ...data },
          update: data,
        });
      }
      for (const o of input.options) {
        const option = await tx.productOption.upsert({
          where: { productId_code: { productId: product.id, code: o.code } },
          create: { productId: product.id, code: o.code },
          update: {},
        });
        for (const t of o.translations)
          await tx.optionTranslation.upsert({
            where: { optionId_locale: { optionId: option.id, locale: t.locale } },
            create: { optionId: option.id, locale: t.locale, name: t.name },
            update: { name: t.name },
          });
        for (const v of o.values) {
          const value = await tx.optionValue.upsert({
            where: { optionId_code: { optionId: option.id, code: v.code } },
            create: { optionId: option.id, code: v.code },
            update: {},
          });
          for (const t of v.translations)
            await tx.optionValueTranslation.upsert({
              where: { valueId_locale: { valueId: value.id, locale: t.locale } },
              create: { valueId: value.id, locale: t.locale, label: t.name },
              update: { label: t.name },
            });
        }
      }
      const options = await tx.productOption.findMany({
        where: { productId: product.id },
        include: { values: true },
      });
      for (const v of input.variants) {
        const selections = v.selections.map((s) => {
          const o = options.find((o) => o.code === s.option)!;
          return { optionId: o.id, valueId: o.values.find((x) => x.code === s.value)!.id };
        });
        const key = canonicalVariantKey(selections);
        const previous = old?.variants.find((x) => x.id === v.id);
        if (previous && previous.combinationKey !== key) throw new CatalogError('VARIANT_IDENTITY');
        const fields = { sku: v.sku, priceIrr: BigInt(v.priceIrr), active: v.active };
        const variant = previous
          ? await tx.variant.update({ where: { id: previous.id }, data: fields })
          : await tx.variant.create({
              data: {
                productId: product.id,
                combinationKey: key,
                ...fields,
              },
            });
        if (!previous && selections.length)
          await tx.variantSelection.createMany({
            data: selections.map((s) => ({ ...s, productId: product.id, variantId: variant.id })),
          });
        const inventory = previous?.inventory;
        if (inventory) {
          if (v.onHand < inventory.reserved) throw new CatalogError('RESERVED_STOCK');
          const result = await tx.inventory.updateMany({
            where: {
              variantId: variant.id,
              version: inventory.version,
              reserved: { lte: v.onHand },
            },
            data: { onHand: v.onHand, version: { increment: 1 } },
          });
          if (result.count !== 1) throw new CatalogError('STALE_EDIT');
        } else await tx.inventory.create({ data: { variantId: variant.id, onHand: v.onHand } });
        const delta = v.onHand - (inventory?.onHand ?? 0);
        if (delta)
          await tx.inventoryMovement.create({
            data: {
              variantId: variant.id,
              delta,
              reason: 'catalog-adjustment',
              reference: `catalog:${product.id}:${variant.id}:${inventory ? inventory.version + 1 : 0}`,
            },
          });
      }
      await tx.auditEvent.create({
        data: {
          actorId,
          action: old ? 'catalog.products.update' : 'catalog.products.create',
          entityType: 'products',
          entityId: product.id,
          metadata: { previousStatus: old?.status ?? null, status: input.status },
        },
      });
      return productDto(
        await tx.product.findUniqueOrThrow({ where: { id: product.id }, include: productInclude }),
      );
    },
    { timeout: 20000 },
  );
}
