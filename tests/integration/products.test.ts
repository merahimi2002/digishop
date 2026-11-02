import { beforeAll, afterAll, it, expect } from 'vitest';
import { randomUUID, randomBytes } from 'node:crypto';
import { createDatabaseClient } from '../../src/server/database/factory';
import { createAuth } from '../../src/server/auth/factory';
import { validateEnvironment } from '../../src/config/env-schema';
import { createCatalogHandler } from '../../src/server/catalog/http';
import {
  readStorefront,
  readStoreProduct,
  storefrontQuery,
  resolveStoreProductRoute,
} from '../../src/server/catalog/storefront';
import { reserveInventory, releaseReservation } from '../../src/server/database/inventory';
import type { ProductItem } from '../../src/lib/product-input';
import { cleanupCatalogFixtures } from '../catalog-cleanup';
const db = createDatabaseClient(process.env.DATABASE_URL!);
const origin = 'http://localhost:3400',
  tag = 'product-' + randomUUID().slice(0, 8);
const env = validateEnvironment({
  ...process.env,
  APP_ENV: 'test',
  AUTH_ENABLED: 'true',
  APP_ORIGIN: origin,
  BETTER_AUTH_SECRET: randomBytes(32).toString('hex'),
});
const auth = createAuth(db, env, async () => {}),
  handle = createCatalogHandler(db, auth, env);
let actor = '',
  cookie = '',
  categoryId = '',
  product: ProductItem;
const tr = (name: string) => [
  { locale: 'fa', name: 'آزمون ' + name, slug: 'آزمون-' + name, description: 'نمونه' },
  { locale: 'en', name: 'Test ' + name, slug: 'test-' + name, description: 'Sample' },
];
const payload = () => ({
  categoryId,
  isDemo: true,
  translations: tr(tag),
  options: [
    {
      code: 'color',
      translations: tr('color'),
      values: [
        { code: 'black', translations: tr('black') },
        { code: 'white', translations: tr('white') },
      ],
    },
  ],
  variants: [
    {
      sku: tag + '-black',
      priceIrr: '9007199254740993',
      onHand: 5,
      active: true,
      selections: [{ option: 'color', value: 'black' }],
    },
    {
      sku: tag + '-white',
      priceIrr: '2000',
      onHand: 0,
      active: true,
      selections: [{ option: 'color', value: 'white' }],
    },
  ],
});
async function call(method: string, data?: unknown, session = cookie, from = origin) {
  return handle(
    new Request(origin + '/api/admin/catalog/products', {
      method,
      headers: { Cookie: session, Origin: from, 'Content-Type': 'application/json' },
      ...(data ? { body: JSON.stringify(data) } : {}),
    }),
    'products',
  );
}
async function save(data: unknown = product) {
  const response = await call('PATCH', data);
  expect(response.status).toBe(200);
  product = (await response.json()).item;
  return product;
}
beforeAll(async () => {
  const { user } = await auth.api.signUpEmail({
    body: {
      name: 'Product fixture',
      email: tag + '@example.test',
      password: 'Product-fixture-passphrase-42',
    },
  });
  actor = user.id;
  await db.user.update({ where: { id: actor }, data: { emailVerified: true, role: 'ADMIN' } });
  const session = await auth.api.signInEmail({
    body: { email: user.email, password: 'Product-fixture-passphrase-42' },
    asResponse: true,
  });
  cookie = session.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
  categoryId = (
    await db.category.create({ data: { code: tag, translations: { create: tr(tag) } } })
  ).id;
});
afterAll(async () => {
  await cleanupCatalogFixtures(
    (await db.product.findMany({ where: { categoryId } })).map((p) => p.id),
  );
  await db.category.deleteMany({ where: { id: categoryId } });
  await db.verification.deleteMany({ where: { value: actor } });
  await db.user.deleteMany({ where: { id: actor } });
  await db.$disconnect();
});
it('enforces principal, role, password and origin on the product endpoint', async () => {
  expect((await call('GET', undefined, '')).status).toBe(401);
  await db.user.update({ where: { id: actor }, data: { role: 'CUSTOMER' } });
  expect((await call('GET')).status).toBe(403);
  await db.user.update({ where: { id: actor }, data: { role: 'ADMIN', mustChangePassword: true } });
  expect((await call('GET')).status).toBe(403);
  await db.user.update({ where: { id: actor }, data: { mustChangePassword: false } });
  expect((await call('POST', payload(), cookie, 'https://evil.example')).status).toBe(403);
});
it('creates bilingual draft, options, two variants and exact BigInt with audit and movement', async () => {
  const response = await call('POST', payload());
  expect(response.status).toBe(201);
  expect(response.headers.get('cache-control')).toContain('no-store');
  product = (await response.json()).item;
  expect(product.variants[0]!.priceIrr).toBe('9007199254740993');
  expect(await db.inventoryMovement.count({ where: { variantId: product.variants[0]!.id } })).toBe(
    1,
  );
  expect(
    await db.auditEvent.count({
      where: { entityId: product.id, action: 'catalog.products.create' },
    }),
  ).toBe(1);
  expect(await readStoreProduct(db, 'en', 'test-' + tag)).toBeNull();
  expect(await resolveStoreProductRoute(db, 'en', 'test-' + tag)).toBeNull();
  expect((await readStorefront(db, 'en', storefrontQuery.parse({ q: tag }))).total).toBe(0);
});
it('publishes to both languages; exposes only active variants and net availability', async () => {
  await save({ ...product, status: 'PUBLISHED' });
  expect(await resolveStoreProductRoute(db, 'en', 'آزمون-' + tag)).toBe('test-' + tag);
  for (const locale of ['fa', 'en']) {
    const publicProduct = await readStoreProduct(
      db,
      locale,
      product.translations.find((t) => t.locale === locale)!.slug!,
    );
    expect(publicProduct?.variants).toHaveLength(2);
    expect(publicProduct).not.toHaveProperty('revision');
    expect(publicProduct?.variants[0]).not.toHaveProperty('reserved');
    expect(
      (await readStorefront(db, locale, storefrontQuery.parse({ q: tag, category: tag }))).total,
    ).toBe(1);
  }
});
it('preserves edits and rejects stale writes after a reservation; cannot erase reserved units', async () => {
  const stale = product;
  const reservation = await reserveInventory(db, {
    variantId: product.variants[0]!.id,
    quantity: 3,
    expiresAt: new Date(Date.now() + 60000),
  });
  expect(reservation).toBeTruthy();
  expect((await call('PATCH', stale)).status).toBe(409);
  const rows = (await (await call('GET')).json()).items as ProductItem[];
  product = rows.find((p) => p.id === product.id)!;
  const response = await call('PATCH', {
    ...product,
    variants: product.variants.map((v, i) => ({ ...v, onHand: i === 0 ? 2 : v.onHand })),
  });
  expect(response.status).toBe(409);
  expect((await response.json()).error).toBe('RESERVED_STOCK');
  expect(
    (await readStoreProduct(db, 'en', 'test-' + tag))?.variants.find(
      (v) => v.id === product.variants[0]!.id,
    )?.available,
  ).toBe(2);
  await releaseReservation(db, reservation!.id);
  product = ((await (await call('GET')).json()).items as ProductItem[]).find(
    (p) => p.id === product.id,
  )!;
});
it('races a stock reduction against a reservation without losing either change', async () => {
  const variantId = product.variants[0]!.id;
  const [response, reservation] = await Promise.all([
    call('PATCH', {
      ...product,
      variants: product.variants.map((v) => ({ ...v, onHand: v.id === variantId ? 2 : v.onHand })),
    }),
    reserveInventory(db, { variantId, quantity: 3, expiresAt: new Date(Date.now() + 60000) }),
  ]);
  expect(Number(response.status === 200) + Number(!!reservation)).toBe(1);
  const inventory = await db.inventory.findUniqueOrThrow({ where: { variantId } });
  expect(inventory.onHand).toBeGreaterThanOrEqual(inventory.reserved);
  expect(inventory.reserved).toBe(reservation ? 3 : 0);
  expect(inventory.onHand).toBe(reservation ? 5 : 2);
  if (reservation) await releaseReservation(db, reservation.id);
  product = ((await (await call('GET')).json()).items as ProductItem[]).find(
    (p) => p.id === product.id,
  )!;
});
it('serializes concurrent product writes so exactly one revision succeeds', async () => {
  const results = await Promise.all([call('PATCH', product), call('PATCH', product)]);
  expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
  product = (await results.find((r) => r.status === 200)!.json()).item;
});
it('rejects foreign IDs, removed variants, option changes and duplicate SKU without partial writes', async () => {
  for (const data of [
    {
      ...product,
      variants: product.variants.map((v, i) => (i === 0 ? { ...v, id: randomUUID() } : v)),
    },
    { ...product, variants: product.variants.slice(0, 1) },
    {
      ...product,
      options: product.options.map((o) => ({ ...o, code: 'finish' })),
      variants: product.variants.map((v) => ({
        ...v,
        selections: v.selections.map((s) => ({ ...s, option: 'finish' })),
      })),
    },
  ])
    expect((await call('PATCH', data)).status).toBe(409);
  const response = await call('POST', payload());
  expect(response.status).toBe(409);
  expect(await db.product.count({ where: { categoryId } })).toBe(1);
});
it('adds a new option value and variant while retaining existing variant identities', async () => {
  const ids = product.variants.map((v) => v.id);
  await save({
    ...product,
    options: product.options.map((o) => ({
      ...o,
      values: [...o.values, { code: 'blue', translations: tr('blue') }],
    })),
    variants: [
      ...product.variants,
      {
        sku: tag + '-blue',
        priceIrr: '3000',
        onHand: 1,
        active: true,
        selections: [{ option: 'color', value: 'blue' }],
      },
    ],
  });
  expect(product.variants).toHaveLength(3);
  for (const id of ids) expect(product.variants.some((v) => v.id === id)).toBe(true);
  expect(
    (await readStoreProduct(db, 'en', 'test-' + tag))?.options[0]?.values.some(
      (v) => v.code === 'blue',
    ),
  ).toBe(true);
});
it('deactivates a variant, updates price and stock, then archives without leaking draft routes', async () => {
  await save({
    ...product,
    variants: product.variants.map((v, i) => ({
      ...v,
      active: i === 0,
      priceIrr: '301',
      onHand: i === 0 ? 8 : v.onHand,
    })),
  });
  const publicProduct = await readStoreProduct(db, 'en', 'test-' + tag);
  expect(publicProduct?.variants).toHaveLength(1);
  expect(publicProduct?.variants[0]?.priceIrr).toBe('301');
  expect(publicProduct?.variants[0]?.available).toBe(8);
  const response = await call('PATCH', {
    ...product,
    variants: product.variants.map((v) => ({ ...v, priceIrr: '0' })),
  });
  expect(response.status).toBe(400);
  await save({ ...product, status: 'ARCHIVED' });
  expect(await readStoreProduct(db, 'en', 'test-' + tag)).toBeNull();
  expect((await readStorefront(db, 'en', storefrontQuery.parse({ q: tag }))).total).toBe(0);
  expect((await call('DELETE', { id: product.id, revision: product.revision })).status).toBe(405);
});
