import { createHash } from 'node:crypto';
import { Prisma, type PrismaClient } from '../../generated/prisma/client';
import {
  catalogInput,
  type CatalogInput,
  type CatalogResource,
  type CatalogItem,
  type CatalogTranslation,
} from '../../lib/catalog-input';
export class CatalogError extends Error {
  constructor(
    public code: string,
    public status = 409,
  ) {
    super(code);
  }
}
type Tx = Prisma.TransactionClient;
const categoryInclude = {
  translations: true,
  _count: { select: { products: true, children: true } },
} as const;
const brandInclude = { translations: true, _count: { select: { products: true } } } as const;
const attributeInclude = {
  translations: true,
  categories: true,
  choices: { include: { translations: true }, orderBy: { code: 'asc' as const } },
  _count: { select: { values: true } },
} as const;
const version = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
function dto(row: Record<string, unknown>): CatalogItem {
  const count = row._count as Record<string, number>;
  const item = {
    id: row.id as string,
    code: row.code as string,
    translations: (row.translations as CatalogTranslation[])
      .map((t) => ({
        locale: t.locale,
        name: t.name,
        description: t.description ?? '',
        ...(t.slug ? { slug: t.slug } : {}),
      }))
      .sort((a, b) => a.locale.localeCompare(b.locale)),
    parentId: (row.parentId as string | undefined) ?? null,
    kind: (row.kind as CatalogInput['kind'] | undefined) ?? 'TEXT',
    unit: (row.unit as string | undefined) ?? '',
    categoryIds: ((row.categories ?? []) as { categoryId: string }[])
      .map((c) => c.categoryId)
      .sort(),
    choices: (
      (row.choices ?? []) as {
        id: string;
        code: string;
        translations: { locale: string; label: string }[];
      }[]
    ).map((c) => ({
      id: c.id,
      code: c.code,
      translations: c.translations
        .map((t) => ({
          locale: t.locale as CatalogTranslation['locale'],
          name: t.label,
          description: '',
        }))
        .sort((a, b) => a.locale.localeCompare(b.locale)),
    })),
    references: Object.values(count).reduce((a, b) => a + b, 0),
  };
  return { ...item, revision: version(item) };
}
async function find(tx: Tx, resource: CatalogResource, id: string) {
  if (resource === 'categories')
    return tx.category.findUnique({ where: { id }, include: categoryInclude });
  if (resource === 'brands')
    return tx.productBrand.findUnique({ where: { id }, include: brandInclude });
  return tx.attribute.findUnique({ where: { id }, include: attributeInclude });
}
export async function listCatalog(db: PrismaClient, resource: CatalogResource, page = 1, q = '') {
  const take = 30,
    skip = (page - 1) * take;
  const where = q
    ? {
        OR: [
          { code: { contains: q, mode: 'insensitive' as const } },
          { translations: { some: { name: { contains: q, mode: 'insensitive' as const } } } },
        ],
      }
    : {};
  return db.$transaction(
    async (tx) => {
      const rows =
        resource === 'categories'
          ? await tx.category.findMany({
              where,
              include: categoryInclude,
              orderBy: { code: 'asc' },
              skip,
              take,
            })
          : resource === 'brands'
            ? await tx.productBrand.findMany({
                where,
                include: brandInclude,
                orderBy: { code: 'asc' },
                skip,
                take,
              })
            : await tx.attribute.findMany({
                where,
                include: attributeInclude,
                orderBy: { code: 'asc' },
                skip,
                take,
              });
      const total =
        resource === 'categories'
          ? await tx.category.count({ where })
          : resource === 'brands'
            ? await tx.productBrand.count({ where })
            : await tx.attribute.count({ where });
      const categories = await tx.category.findMany({
        select: { id: true, code: true, translations: true },
        orderBy: { code: 'asc' },
        take: 501,
      });
      if (categories.length > 500) throw new CatalogError('CATEGORY_LIMIT', 409);
      return {
        items: rows.map((row) => dto(row)),
        total,
        page,
        pages: Math.max(1, Math.ceil(total / take)),
        categories,
      };
    },
    { isolationLevel: 'RepeatableRead' },
  );
}
export async function mutateCatalog(
  db: PrismaClient,
  resource: CatalogResource,
  actorId: string,
  operation: 'create' | 'update' | 'delete',
  payload: unknown,
  id?: string,
  revision?: string,
) {
  return db.$transaction(
    async (tx) => {
      // Serialize taxonomy mutations: two concurrent parent edits must not create a cycle.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(74305)`;
      const previous = id ? await find(tx, resource, id) : null;
      if (operation !== 'create') {
        if (!previous) throw new CatalogError('NOT_FOUND', 404);
        if (dto(previous).revision !== revision) throw new CatalogError('STALE_EDIT');
      }
      let entityId = id;
      if (operation === 'delete') {
        if (resource === 'categories') {
          await tx.categoryAttribute.deleteMany({ where: { categoryId: id } });
          await tx.category.delete({ where: { id } });
        } else if (resource === 'brands') await tx.productBrand.delete({ where: { id } });
        else {
          await tx.categoryAttribute.deleteMany({ where: { attributeId: id } });
          await tx.attribute.delete({ where: { id } });
        }
      } else {
        const data = catalogInput.parse(payload);
        const { code, translations, parentId, kind, unit, choices, categoryIds } = data;
        if (resource === 'categories') {
          if (translations.some((t) => !t.slug)) throw new CatalogError('INVALID_INPUT', 400);
          const fields = { code, parentId };
          const row =
            operation === 'create'
              ? await tx.category.create({ data: fields })
              : await tx.category.update({ where: { id }, data: fields });
          entityId = row.id;
          for (const t of translations) {
            const values = { name: t.name, slug: t.slug!, description: t.description };
            await tx.categoryTranslation.upsert({
              where: { categoryId_locale: { categoryId: row.id, locale: t.locale } },
              create: { categoryId: row.id, locale: t.locale, ...values },
              update: values,
            });
          }
        } else if (resource === 'brands') {
          const row =
            operation === 'create'
              ? await tx.productBrand.create({ data: { code } })
              : await tx.productBrand.update({ where: { id }, data: { code } });
          entityId = row.id;
          for (const t of translations)
            await tx.brandTranslation.upsert({
              where: { brandId_locale: { brandId: row.id, locale: t.locale } },
              create: { brandId: row.id, locale: t.locale, name: t.name },
              update: { name: t.name },
            });
        } else {
          if (previous && 'kind' in previous && previous.kind !== kind)
            throw new CatalogError('IMMUTABLE_KIND');
          if ((kind === 'OPTION') !== choices.length > 0 || (unit && kind !== 'NUMBER'))
            throw new CatalogError('INVALID_INPUT', 400);
          const row =
            operation === 'create'
              ? await tx.attribute.create({ data: { code, kind, unit: unit || null } })
              : await tx.attribute.update({ where: { id }, data: { code, unit: unit || null } });
          entityId = row.id;
          for (const t of translations)
            await tx.attributeTranslation.upsert({
              where: { attributeId_locale: { attributeId: row.id, locale: t.locale } },
              create: { attributeId: row.id, locale: t.locale, name: t.name },
              update: { name: t.name },
            });
          await tx.categoryAttribute.deleteMany({
            where: { attributeId: row.id, categoryId: { notIn: categoryIds } },
          });
          for (const categoryId of categoryIds)
            await tx.categoryAttribute.upsert({
              where: { categoryId_attributeId: { categoryId, attributeId: row.id } },
              create: { categoryId, attributeId: row.id },
              update: {},
            });
          const old = await tx.attributeChoice.findMany({
            where: { attributeId: row.id },
            select: { id: true },
          });
          if (choices.some((c) => c.id && !old.some((o) => o.id === c.id)))
            throw new CatalogError('INVALID_CHOICE', 400);
          await tx.attributeChoice.deleteMany({
            where: {
              attributeId: row.id,
              id: { notIn: choices.flatMap((c) => (c.id ? [c.id] : [])) },
            },
          });
          for (const c of choices) {
            const choice = c.id
              ? await tx.attributeChoice.update({ where: { id: c.id }, data: { code: c.code } })
              : await tx.attributeChoice.create({ data: { attributeId: row.id, code: c.code } });
            for (const t of c.translations)
              await tx.choiceTranslation.upsert({
                where: { choiceId_locale: { choiceId: choice.id, locale: t.locale } },
                create: { choiceId: choice.id, locale: t.locale, label: t.name },
                update: { label: t.name },
              });
          }
        }
      }
      await tx.auditEvent.create({
        data: {
          actorId,
          action: `catalog.${resource}.${operation}`,
          entityType: resource,
          entityId: entityId!,
        },
      });
      return operation === 'delete' ? null : dto((await find(tx, resource, entityId!))!);
    },
    { timeout: 15000 },
  );
}
export function catalogFailure(error: unknown) {
  if (error instanceof CatalogError) return { error: error.code, status: error.status };
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return { error: 'DUPLICATE', status: 409 };
    if (error.code === 'P2025') return { error: 'NOT_FOUND', status: 404 };
    return { error: 'CONFLICT', status: 409 };
  }
  return { error: 'UNAVAILABLE', status: 503 };
}
