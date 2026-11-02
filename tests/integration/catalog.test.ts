import { beforeAll, afterAll, it, expect } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import { validateEnvironment } from '../../src/config/env-schema';
import { createDatabaseClient } from '../../src/server/database/factory';
import { createAuth } from '../../src/server/auth/factory';
import { createCatalogHandler } from '../../src/server/catalog/http';
import type { CatalogItem } from '../../src/lib/catalog-input';
const db = createDatabaseClient(process.env.DATABASE_URL!);
const origin = 'http://localhost:3400';
const env = validateEnvironment({
  ...process.env,
  APP_ENV: 'test',
  AUTH_ENABLED: 'true',
  APP_ORIGIN: origin,
  BETTER_AUTH_SECRET: randomBytes(32).toString('hex'),
});
const auth = createAuth(db, env, async () => {}),
  handle = createCatalogHandler(db, auth, env);
const tag = 'taxonomy-' + randomUUID().slice(0, 8),
  password = 'Taxonomy-fixture-passphrase-42';
let actor = '',
  cookie = '',
  category: CatalogItem,
  child: CatalogItem,
  brand: CatalogItem,
  attribute: CatalogItem;
const translations = (name: string, category = false) => [
  { locale: 'fa', name: 'آزمون ' + name, ...(category ? { slug: 'آزمون-' + name } : {}) },
  { locale: 'en', name: 'Test ' + name, ...(category ? { slug: 'test-' + name } : {}) },
];
async function call(
  resource: string,
  method = 'GET',
  body?: unknown,
  customCookie = cookie,
  customOrigin = origin,
) {
  return handle(
    new Request(origin + '/api/admin/catalog/' + resource, {
      method,
      headers: { Cookie: customCookie, Origin: customOrigin, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
    resource,
  );
}
beforeAll(async () => {
  const { user } = await auth.api.signUpEmail({
    body: { name: 'Taxonomy test', email: tag + '@example.test', password },
  });
  actor = user.id;
  await db.user.update({ where: { id: actor }, data: { emailVerified: true, role: 'ADMIN' } });
  const result = await auth.api.signInEmail({
    body: { email: user.email, password },
    asResponse: true,
  });
  cookie = result.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
});
afterAll(async () => {
  await db.attribute.deleteMany({ where: { code: { startsWith: tag } } });
  await db.category.deleteMany({ where: { code: tag + '-child' } });
  await db.category.deleteMany({ where: { code: { startsWith: tag } } });
  await db.productBrand.deleteMany({ where: { code: { startsWith: tag } } });
  await db.verification.deleteMany({ where: { value: actor } });
  await db.user.deleteMany({ where: { id: actor } });
  await db.$disconnect();
});
it('rejects anonymous, customer, forced-password and cross-origin writes', async () => {
  expect((await call('categories', 'GET', undefined, '')).status).toBe(401);
  await db.user.update({ where: { id: actor }, data: { role: 'CUSTOMER' } });
  expect((await call('categories')).status).toBe(403);
  await db.user.update({ where: { id: actor }, data: { role: 'ADMIN', mustChangePassword: true } });
  expect((await call('categories')).status).toBe(403);
  await db.user.update({ where: { id: actor }, data: { mustChangePassword: false } });
  expect((await call('categories', 'POST', {}, cookie, 'https://evil.example')).status).toBe(403);
});
it('creates translated categories and brands with no-store DTOs and audit', async () => {
  let response = await call('categories', 'POST', {
    code: tag,
    translations: translations(tag, true),
  });
  expect(response.status).toBe(201);
  expect(response.headers.get('cache-control')).toContain('no-store');
  category = (await response.json()).item;
  response = await call('categories', 'POST', {
    code: tag + '-child',
    parentId: category.id,
    translations: translations(tag + '-child', true),
  });
  child = (await response.json()).item;
  response = await call('brands', 'POST', { code: tag, translations: translations(tag) });
  brand = (await response.json()).item;
  expect(brand.translations).toHaveLength(2);
  expect(
    await db.auditEvent.count({ where: { actorId: actor, action: 'catalog.categories.create' } }),
  ).toBe(2);
});
it('rejects missing/duplicate locale, slug injection and malformed/oversize JSON', async () => {
  for (const body of [
    { code: tag + '-bad', translations: [translations(tag)[0]] },
    { code: tag + '-bad', translations: [translations(tag)[0], translations(tag)[0]] },
    {
      code: tag + '-bad',
      translations: translations(tag, true).map((t) => ({ ...t, slug: 'bad/slug' })),
    },
  ])
    expect((await call('categories', 'POST', body)).status).toBe(400);
  const response = await handle(
    new Request(origin + '/api/admin/catalog/categories', {
      method: 'POST',
      headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' },
      body: '{' + 'x'.repeat(70000),
    }),
    'categories',
  );
  expect(response.status).toBe(400);
});
it('rejects duplicate codes and duplicate slugs atomically', async () => {
  expect(
    (await call('brands', 'POST', { code: tag, translations: translations('duplicate') })).status,
  ).toBe(409);
  expect(
    (
      await call('categories', 'POST', {
        code: tag + '-duplicate',
        translations: translations(tag, true),
      })
    ).status,
  ).toBe(409);
  expect(await db.category.count({ where: { code: tag + '-duplicate' } })).toBe(0);
});
it('rejects a category cycle and keeps the original parent', async () => {
  const latest = await call('categories');
  category = (await latest.json()).items.find((c: CatalogItem) => c.id === category.id);
  const response = await call('categories', 'PATCH', { ...category, parentId: child.id });
  expect(response.status).toBe(409);
  expect((await db.category.findUniqueOrThrow({ where: { id: category.id } })).parentId).toBeNull();
});
it('rejects stale updates, preserving the first writer', async () => {
  let response = await call('brands', 'PATCH', { ...brand, translations: translations('updated') });
  expect(response.status).toBe(200);
  const updated = (await response.json()).item;
  response = await call('brands', 'PATCH', { ...brand, translations: translations('lost') });
  expect(response.status).toBe(409);
  expect((await response.json()).error).toBe('STALE_EDIT');
  brand = updated;
});
it('creates typed choices, translations and category scope', async () => {
  const response = await call('attributes', 'POST', {
    code: tag,
    kind: 'OPTION',
    categoryIds: [category.id],
    translations: translations('connection'),
    choices: [{ code: 'usb-c', translations: translations('USB-C') }],
  });
  expect(response.status).toBe(201);
  attribute = (await response.json()).item;
  expect(attribute.choices[0]!.translations.find((t) => t.locale === 'en')!.name).toBe(
    'Test USB-C',
  );
  expect(attribute.categoryIds).toEqual([category.id]);
});
it('rejects kind changes and foreign choice ids without partial updates', async () => {
  expect(
    (await call('attributes', 'PATCH', { ...attribute, kind: 'TEXT', choices: [] })).status,
  ).toBe(409);
  expect(
    (
      await call('attributes', 'PATCH', {
        ...attribute,
        choices: [{ ...attribute.choices[0], id: randomUUID() }],
      })
    ).status,
  ).toBe(400);
  expect(await db.attributeChoice.count({ where: { attributeId: attribute.id } })).toBe(1);
});
it('returns bounded searchable lists and validates pagination', async () => {
  const response = await handle(
    new Request(origin + '/api/admin/catalog/categories?q=' + tag + '&page=1', {
      headers: { Cookie: cookie },
    }),
    'categories',
  );
  const result = await response.json();
  expect(result.total).toBe(2);
  expect(result.items.length).toBeLessThanOrEqual(30);
  expect(
    (
      await handle(
        new Request(origin + '/api/admin/catalog/categories?page=0', {
          headers: { Cookie: cookie },
        }),
        'categories',
      )
    ).status,
  ).toBe(400);
});
it('protects attributes and category scope already used by a product', async () => {
  const product = await db.product.create({
    data: {
      categoryId: category.id,
      translations: {
        create: { locale: 'en', name: 'Referenced fixture', slug: tag + '-product' },
      },
    },
  });
  try {
    await db.productAttributeValue.create({
      data: {
        productId: product.id,
        attributeId: attribute.id,
        kind: 'OPTION',
        locale: '*',
        choiceId: attribute.choices[0]!.id!,
      },
    });
    expect((await call('attributes', 'PATCH', { ...attribute, categoryIds: [] })).status).toBe(409);
    expect((await call('attributes', 'DELETE', attribute)).status).toBe(409);
    expect(await db.categoryAttribute.count({ where: { attributeId: attribute.id } })).toBe(1);
  } finally {
    await db.product.delete({ where: { id: product.id } });
  }
});
it('prevents deleting a parent, then allows explicit child-first deletion', async () => {
  const result = await (await call('categories')).json();
  category = result.items.find((c: CatalogItem) => c.id === category.id);
  expect((await call('categories', 'DELETE', category)).status).toBe(409);
  expect((await call('attributes', 'DELETE', attribute)).status).toBe(200);
  expect((await call('categories', 'DELETE', child)).status).toBe(200);
  category = (await (await call('categories')).json()).items.find(
    (c: CatalogItem) => c.id === category.id,
  );
  const deletedParent = await call('categories', 'DELETE', category);
  expect({ status: deletedParent.status, body: await deletedParent.json() }).toEqual({
    status: 200,
    body: { item: null },
  });
  expect((await call('brands', 'DELETE', brand)).status).toBe(200);
});
