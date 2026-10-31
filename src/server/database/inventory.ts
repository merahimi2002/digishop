import { z } from 'zod';
import type { PrismaClient, Prisma } from '../../generated/prisma/client';
const reservationInput = z.object({
  variantId: z.uuid(),
  quantity: z.number().int().positive().max(2147483647),
  expiresAt: z.date(),
});
/** Internal primitive only. R06/R07 must authorize caller/cart and set their own expiry policy. */
export async function reserveInventory(db: PrismaClient, input: z.input<typeof reservationInput>) {
  const { variantId, quantity, expiresAt } = reservationInput.parse(input);
  if (expiresAt <= new Date()) throw new Error('Reservation expiry must be in the future');
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ variantId: string }[]>`
   UPDATE "Inventory" SET reserved=reserved+${quantity}, version=version+1
   WHERE "variantId"=${variantId}::uuid AND "onHand"-reserved>=${quantity}
   RETURNING "variantId"`;
    if (!rows.length) return null;
    return tx.inventoryReservation.create({ data: { variantId, quantity, expiresAt } });
  });
}
export async function releaseReservation(
  db: PrismaClient,
  id: string,
  status: 'RELEASED' | 'EXPIRED' = 'RELEASED',
) {
  z.uuid().parse(id);
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ variantId: string; quantity: number }[]>`
   UPDATE "InventoryReservation" SET status=${status}::"ReservationStatus"
   WHERE id=${id}::uuid AND status='ACTIVE' AND (${status}='RELEASED' OR "expiresAt"<=now())
   RETURNING "variantId",quantity`;
    const row = rows[0];
    if (!row) return false;
    await tx.inventory.update({
      where: { variantId: row.variantId },
      data: { reserved: { decrement: row.quantity }, version: { increment: 1 } },
    });
    return true;
  });
}
export function canonicalVariantKey(selections: { optionId: string; valueId: string }[]) {
  const validated = selections.map((item) => {
    const value = z.object({ optionId: z.uuid(), valueId: z.uuid() }).parse(item);
    return { optionId: value.optionId.toLowerCase(), valueId: value.valueId.toLowerCase() };
  });
  if (new Set(validated.map((item) => item.optionId)).size !== validated.length)
    throw new Error('Duplicate option');
  return (
    validated
      .sort((a, b) => a.optionId.localeCompare(b.optionId))
      .map((item) => `${item.optionId}=${item.valueId}`)
      .join(',') || 'default'
  );
}
export type Transaction = Prisma.TransactionClient;
