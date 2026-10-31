import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { randomUUID, createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import pg from 'pg';
import { createDatabaseClient } from '../../src/server/database/factory';
import {
  reserveInventory,
  releaseReservation,
  canonicalVariantKey,
} from '../../src/server/database/inventory';
import { seedDemo, demoId } from '../../prisma/demo';
const db = createDatabaseClient(process.env.DATABASE_URL!);
const owner = new pg.Pool({ connectionString: process.env.DIRECT_DATABASE_URL, max: 4 });
const app = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
const digest = createHash('sha256').update('integration-fixture').digest('hex');
async function rollback(run: (client: pg.PoolClient) => Promise<void>) {
  const client = await owner.connect();
  await client.query('BEGIN');
  try {
    await run(client);
  } finally {
    await client.query('ROLLBACK');
    client.release();
  }
}
async function newProduct(client: pg.PoolClient) {
  const id = randomUUID();
  await client.query('INSERT INTO "Product" (id,"categoryId","isDemo") VALUES ($1,$2,true)', [
    id,
    demoId('category:audio'),
  ]);
  return id;
}
async function testVariant(stock = 3) {
  const product = await db.product.create({
    data: { categoryId: demoId('category:workspace'), isDemo: true },
  });
  return db.variant.create({
    data: {
      productId: product.id,
      sku: 'TEST-' + randomUUID().toUpperCase(),
      priceIrr: 100n,
      inventory: { create: { onHand: stock } },
    },
  });
}
beforeAll(async () => {
  await seedDemo(db);
});
afterAll(async () => {
  await db.$disconnect();
  await owner.end();
  await app.end();
});
describe('PostgreSQL R03 integrity', () => {
  it('runs against PostgreSQL 18 and uses a non-owner, non-DDL app role', async () => {
    const result = await app.query('SHOW server_version');
    expect(result.rows[0].server_version).toMatch(/^18\./);
    await expect(app.query('CREATE TABLE r03_forbidden (id integer)')).rejects.toMatchObject({
      code: '42501',
    });
    await expect(app.query('SELECT * FROM "_prisma_migrations"')).rejects.toMatchObject({
      code: '42501',
    });
  });
  it('seeds deterministically without users, publishing or resetting inventory', async () => {
    const before = await db.product.count({ where: { isDemo: true } });
    await seedDemo(db);
    await seedDemo(db);
    expect(await db.product.count({ where: { isDemo: true } })).toBe(before);
    expect(await db.user.count()).toBe(0);
    expect(
      await db.product.count({
        where: {
          id: { in: ['headphones', 'keyboard', 'mouse'].map((p) => demoId('product:' + p)) },
          status: 'PUBLISHED',
        },
      }),
    ).toBe(0);
  });
  it('rejects duplicate SKU and duplicate local slug', async () => {
    await rollback(async (c) => {
      await expect(
        c.query('INSERT INTO "Variant" ("productId",sku,"priceIrr") VALUES ($1,$2,1)', [
          demoId('product:headphones'),
          'DEMO-HEADPHONES',
        ]),
      ).rejects.toMatchObject({ code: '23505' });
    });
    await rollback(async (c) => {
      const id = await newProduct(c);
      await expect(
        c.query(
          "INSERT INTO \"ProductTranslation\" (\"productId\",locale,name,slug) VALUES ($1,'fa','Fixture','demo-headphones')",
          [id],
        ),
      ).rejects.toMatchObject({ code: '23505' });
    });
  });
  it('rejects duplicate variant combinations under different SKUs', async () => {
    await rollback(async (c) => {
      await expect(
        c.query('INSERT INTO "Variant" ("productId",sku,"priceIrr") VALUES ($1,$2,1)', [
          demoId('product:keyboard'),
          'TEST-' + randomUUID().toUpperCase(),
        ]),
      ).rejects.toMatchObject({ code: '23505' });
    });
  });
  it('validates complete canonical option selections on commit', async () => {
    await rollback(async (c) => {
      await c.query(
        'INSERT INTO "Variant" ("productId",sku,"priceIrr","combinationKey") VALUES ($1,$2,1,\'forged\')',
        [demoId('product:headphones'), 'TEST-' + randomUUID().toUpperCase()],
      );
      await expect(c.query('SET CONSTRAINTS ALL IMMEDIATE')).rejects.toMatchObject({
        code: '23514',
      });
    });
    const option = demoId('option:finish'),
      value = demoId('value:silver');
    expect(canonicalVariantKey([{ optionId: option, valueId: value }])).toBe(option + '=' + value);
  });
  it('rejects cross-product option membership', async () => {
    await rollback(async (c) => {
      await expect(
        c.query(
          'INSERT INTO "VariantSelection" ("variantId","productId","optionId","valueId") VALUES ($1,$2,$3,$4)',
          [
            demoId('variant:keyboard'),
            demoId('product:keyboard'),
            demoId('option:finish'),
            demoId('value:silver'),
          ],
        ),
      ).rejects.toMatchObject({ code: '23503' });
    });
  });
  it('rejects negative money, impossible stock and nonpositive cart quantity', async () => {
    await rollback(async (c) => {
      await expect(
        c.query('UPDATE "Variant" SET "priceIrr"=-1 WHERE id=$1', [demoId('variant:keyboard')]),
      ).rejects.toMatchObject({ code: '23514' });
    });
    await rollback(async (c) => {
      await expect(
        c.query('UPDATE "Inventory" SET reserved="onHand"+1 WHERE "variantId"=$1', [
          demoId('variant:keyboard'),
        ]),
      ).rejects.toMatchObject({ code: '23514' });
    });
    await rollback(async (c) => {
      const cart = await c.query(
        'INSERT INTO "Cart" ("guestTokenHash","expiresAt") VALUES ($1,now()+interval \'1 day\') RETURNING id',
        [digest],
      );
      await expect(
        c.query('INSERT INTO "CartItem" ("cartId","variantId",quantity) VALUES ($1,$2,0)', [
          cart.rows[0].id,
          demoId('variant:keyboard'),
        ]),
      ).rejects.toMatchObject({ code: '23514' });
    });
  });
  it('enforces typed attributes and prevents category cycles', async () => {
    await rollback(async (c) => {
      await expect(
        c.query('UPDATE "ProductAttributeValue" SET "textValue"=\'bad\' WHERE "productId"=$1', [
          demoId('product:headphones'),
        ]),
      ).rejects.toMatchObject({ code: '23514' });
    });
    await rollback(async (c) => {
      await expect(
        c.query('UPDATE "Category" SET "parentId"=$1 WHERE id=$2', [
          demoId('category:audio'),
          demoId('root'),
        ]),
      ).rejects.toMatchObject({ code: '23514' });
    });
  });
  it('requires normalized identities and hashed one-use tokens', async () => {
    await rollback(async (c) => {
      await expect(
        c.query("INSERT INTO \"User\" (email,name) VALUES ('UPPER@example.test','Fixture')"),
      ).rejects.toMatchObject({ code: '23514' });
    });
    await rollback(async (c) => {
      await expect(
        c.query(
          "INSERT INTO \"Verification\" (identifier,value,\"expiresAt\") VALUES ('fixture','raw-token',now()+interval '1 hour')",
        ),
      ).rejects.toMatchObject({ code: '23514' });
    });
  });
  it('reserves stock atomically under 20 competing requests and releases only once', async () => {
    const variant = await testVariant(3);
    const result = await Promise.all(
      Array.from({ length: 20 }, () =>
        reserveInventory(db, {
          variantId: variant.id,
          quantity: 1,
          expiresAt: new Date(Date.now() + 60000),
        }),
      ),
    );
    const reservations = result.filter((r) => r !== null);
    expect(reservations).toHaveLength(3);
    expect(
      (await db.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).reserved,
    ).toBe(3);
    const releases = await Promise.all(
      Array.from({ length: 10 }, () => releaseReservation(db, reservations[0]!.id)),
    );
    expect(releases.filter(Boolean)).toHaveLength(1);
    for (const r of reservations) await releaseReservation(db, r.id);
    expect(
      (await db.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).reserved,
    ).toBe(0);
  });
  it('rolls back inventory changes when reservation insertion fails', async () => {
    const variant = await testVariant();
    await expect(
      db.$transaction(async (tx) => {
        await tx.inventory.update({
          where: { variantId: variant.id },
          data: { reserved: { increment: 1 } },
        });
        await tx.inventoryReservation.create({
          data: { variantId: variant.id, quantity: 0, expiresAt: new Date(Date.now() + 60000) },
        });
      }),
    ).rejects.toThrow();
    expect(
      (await db.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).reserved,
    ).toBe(0);
  });
  it('retains order snapshots after deleting the user', async () => {
    await rollback(async (c) => {
      const user = await c.query(
        'INSERT INTO "User" (email,name) VALUES ($1,\'Fixture\') RETURNING id',
        [randomUUID() + '@example.test'],
      );
      const order = await c.query(
        'INSERT INTO "Order" (number,"userId","subtotalIrr","totalIrr") VALUES ($1,$2,100,100) RETURNING id',
        [randomUUID(), user.rows[0].id],
      );
      await c.query(
        'INSERT INTO "OrderItem" ("orderId","skuSnapshot","nameSnapshot",quantity,"unitPriceIrr","totalIrr") VALUES ($1,\'OLD-SKU\',\'Old name\',1,100,100)',
        [order.rows[0].id],
      );
      await c.query('DELETE FROM "User" WHERE id=$1', [user.rows[0].id]);
      const stored = await c.query('SELECT "userId" FROM "Order" WHERE id=$1', [order.rows[0].id]);
      expect(stored.rows[0].userId).toBeNull();
      expect(
        (
          await c.query('SELECT "nameSnapshot" FROM "OrderItem" WHERE "orderId"=$1', [
            order.rows[0].id,
          ])
        ).rows[0].nameSnapshot,
      ).toBe('Old name');
    });
  });
  it('enforces order totals, payment amount and provider reference uniqueness', async () => {
    await rollback(async (c) => {
      await expect(
        c.query('INSERT INTO "Order" (number,"subtotalIrr","totalIrr") VALUES ($1,100,99)', [
          randomUUID(),
        ]),
      ).rejects.toMatchObject({ code: '23514' });
    });
    await rollback(async (c) => {
      const order = await c.query(
        'INSERT INTO "Order" (number,"subtotalIrr","totalIrr") VALUES ($1,100,100) RETURNING id',
        [randomUUID()],
      );
      await expect(
        c.query(
          'INSERT INTO "PaymentAttempt" ("orderId",provider,"amountIrr","idempotencyKey","requestHash") VALUES ($1,\'test\',99,$2,$3)',
          [order.rows[0].id, randomUUID(), digest],
        ),
      ).rejects.toMatchObject({ code: '23514' });
    });
    await rollback(async (c) => {
      const order = await c.query(
        'INSERT INTO "Order" (number,"subtotalIrr","totalIrr") VALUES ($1,100,100) RETURNING id',
        [randomUUID()],
      );
      await c.query(
        'INSERT INTO "PaymentAttempt" ("orderId",provider,"providerReference","amountIrr","idempotencyKey","requestHash") VALUES ($1,\'test\',\'ref\',100,$2,$3)',
        [order.rows[0].id, randomUUID(), digest],
      );
      await expect(
        c.query(
          'INSERT INTO "PaymentAttempt" ("orderId",provider,"providerReference","amountIrr","idempotencyKey","requestHash") VALUES ($1,\'test\',\'ref\',100,$2,$3)',
          [order.rows[0].id, randomUUID(), digest],
        ),
      ).rejects.toMatchObject({ code: '23505' });
    });
  });
  it('enforces append-only inventory/audit and idempotency scope uniqueness', async () => {
    await rollback(async (c) => {
      const event = await c.query(
        'INSERT INTO "AuditEvent" (action,"entityType","entityId") VALUES (\'fixture\',\'test\',\'test\') RETURNING id',
      );
      await expect(
        c.query('DELETE FROM "AuditEvent" WHERE id=$1', [event.rows[0].id]),
      ).rejects.toMatchObject({ code: '55000' });
    });
    await rollback(async (c) => {
      await c.query(
        'INSERT INTO "IdempotencyRecord" (scope,key,"requestHash","expiresAt") VALUES (\'fixture\',\'same\',$1,now()+interval \'1 day\')',
        [digest],
      );
      await expect(
        c.query(
          'INSERT INTO "IdempotencyRecord" (scope,key,"requestHash","expiresAt") VALUES (\'fixture\',\'same\',$1,now()+interval \'1 day\')',
          [digest],
        ),
      ).rejects.toMatchObject({ code: '23505' });
    });
  });
  it('uses the locale/slug unique index with a representative 2000-row plan', async () => {
    await rollback(async (c) => {
      await c.query(
        'WITH products AS (INSERT INTO "Product" (id,"categoryId","isDemo") SELECT gen_random_uuid(),$1,true FROM generate_series(1,2000) RETURNING id) INSERT INTO "ProductTranslation" ("productId",locale,name,slug) SELECT id,\'en\',\'Plan fixture\',\'plan-\'||id::text FROM products',
        [demoId('category:workspace')],
      );
      await c.query('ANALYZE "ProductTranslation"');
      const target = await c.query(
        'SELECT slug FROM "ProductTranslation" WHERE slug LIKE \'plan-%\' LIMIT 1',
      );
      const plan = await c.query(
        'EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT "productId" FROM "ProductTranslation" WHERE locale=\'en\' AND slug=$1',
        [target.rows[0].slug],
      );
      const encoded = JSON.stringify(plan.rows);
      mkdirSync('output/r03', { recursive: true });
      writeFileSync('output/r03/query-plan.json', JSON.stringify(plan.rows, null, 2));
      expect(encoded).toMatch(/Index (Only )?Scan/);
      expect(encoded).toContain('ProductTranslation_locale_slug_key');
      console.log('Query plan: locale/slug index used on 2000 representative rows.');
    });
  });
});

it('rejects out-of-category attribute values', async () => {
  await rollback(async (c) => {
    await expect(
      c.query('UPDATE "ProductAttributeValue" SET "productId"=$1 WHERE "productId"=$2', [
        demoId('product:keyboard'),
        demoId('product:headphones'),
      ]),
    ).rejects.toMatchObject({ code: '23514' });
  });
});
it('protects historical slugs and coupon usage limits', async () => {
  await rollback(async (c) => {
    const slug = 'old-' + randomUUID();
    await c.query(
      `INSERT INTO "ProductSlugHistory" ("productId",locale,slug) VALUES ($1,'en',$2)`,
      [demoId('product:keyboard'), slug],
    );
    const id = await newProduct(c);
    await expect(
      c.query(
        `INSERT INTO "ProductTranslation" ("productId",locale,name,slug) VALUES ($1,'en','Fixture',$2)`,
        [id, slug],
      ),
    ).rejects.toMatchObject({ code: '23505' });
  });
  await rollback(async (c) => {
    await expect(
      c.query(
        `INSERT INTO "Coupon" (code,kind,value,"usageLimit","usedCount","expiresAt") VALUES ('LIMIT-TEST','PERCENT',10,1,2,now()+interval '1 day')`,
      ),
    ).rejects.toMatchObject({ code: '23514' });
  });
});
it('freezes the order amount after a payment attempt exists', async () => {
  await rollback(async (c) => {
    const order = await c.query(
      'INSERT INTO "Order" (number,"subtotalIrr","totalIrr") VALUES ($1,100,100) RETURNING id',
      [randomUUID()],
    );
    await c.query(
      `INSERT INTO "PaymentAttempt" ("orderId",provider,"amountIrr","idempotencyKey","requestHash") VALUES ($1,'test',100,$2,$3)`,
      [order.rows[0].id, randomUUID(), digest],
    );
    await expect(
      c.query('UPDATE "Order" SET "subtotalIrr"=200,"totalIrr"=200 WHERE id=$1', [
        order.rows[0].id,
      ]),
    ).rejects.toMatchObject({ code: '23514' });
  });
});
it('preserves integer money above JS safe range and rejects bigint overflow', async () => {
  await rollback(async (c) => {
    await c.query('UPDATE "Variant" SET "priceIrr"=$1 WHERE id=$2', [
      '9007199254740993',
      demoId('variant:keyboard'),
    ]);
    const stored = await c.query('SELECT "priceIrr"::text AS amount FROM "Variant" WHERE id=$1', [
      demoId('variant:keyboard'),
    ]);
    expect(stored.rows[0].amount).toBe('9007199254740993');
    await expect(
      c.query('UPDATE "Variant" SET "priceIrr"=$1 WHERE id=$2', [
        '9223372036854775808',
        demoId('variant:keyboard'),
      ]),
    ).rejects.toMatchObject({ code: '22003' });
  });
});
it('prevents mutation of the inventory movement ledger', async () => {
  await rollback(async (c) => {
    const movement = await c.query(
      'INSERT INTO "InventoryMovement" ("variantId",delta,reason) VALUES ($1,1,\'fixture\') RETURNING id',
      [demoId('variant:keyboard')],
    );
    await expect(
      c.query('UPDATE "InventoryMovement" SET delta=2 WHERE id=$1', [movement.rows[0].id]),
    ).rejects.toMatchObject({ code: '55000' });
  });
});
