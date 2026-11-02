import pg from 'pg';
/** Test-only teardown: the production application cannot mutate the ledger. */
export async function cleanupCatalogFixtures(productIds: string[]) {
  if (!productIds.length) return;
  if (!new URL(process.env.DIRECT_DATABASE_URL!).pathname.endsWith('_test'))
    throw new Error('Test database required');
  const pool = new pg.Pool({ connectionString: process.env.DIRECT_DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(74305)');
    // The table lock and trigger change are transaction-scoped and restored before commit.
    await client.query('ALTER TABLE "InventoryMovement" DISABLE TRIGGER movement_immutable');
    await client.query(
      'DELETE FROM "InventoryMovement" WHERE "variantId" IN (SELECT id FROM "Variant" WHERE "productId" = ANY($1::uuid[]))',
      [productIds],
    );
    await client.query('ALTER TABLE "InventoryMovement" ENABLE TRIGGER movement_immutable');
    for (const table of ['InventoryReservation', 'Inventory'])
      await client.query(
        `DELETE FROM "${table}" WHERE "variantId" IN (SELECT id FROM "Variant" WHERE "productId" = ANY($1::uuid[]))`,
        [productIds],
      );
    await client.query('DELETE FROM "VariantSelection" WHERE "productId" = ANY($1::uuid[])', [
      productIds,
    ]);
    await client.query('DELETE FROM "Variant" WHERE "productId" = ANY($1::uuid[])', [productIds]);
    await client.query('DELETE FROM "Product" WHERE id = ANY($1::uuid[])', [productIds]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
