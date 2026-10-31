import { createHash } from 'node:crypto';
import type { PrismaClient } from '../src/generated/prisma/client';
import { canonicalVariantKey } from '../src/server/database/inventory';
export function demoId(key: string) {
  const chars = createHash('sha256')
    .update('digishop:r03:demo:' + key)
    .digest('hex')
    .slice(0, 32)
    .split('');
  chars[12] = '4';
  chars[16] = '8';
  const s = chars.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}
/** Explicit, deterministic, draft-only fixtures. Never imported by public pages. */
export async function seedDemo(db: PrismaClient) {
  return db.$transaction(
    async (tx) => {
      const root = demoId('root');
      await tx.category.upsert({
        where: { id: root },
        update: {},
        create: { id: root, code: 'demo-computer-accessories' },
      });
      for (const [code, fa, en] of [
        ['audio', 'صدا', 'Audio'],
        ['workspace', 'فضای کار', 'Workspace'],
        ['accessories', 'لوازم جانبی', 'Accessories'],
      ]) {
        const id = demoId('category:' + code);
        await tx.category.upsert({
          where: { id },
          update: {},
          create: { id, parentId: root, code: 'demo-' + code },
        });
        for (const [locale, name] of [
          ['fa', fa],
          ['en', en],
        ])
          await tx.categoryTranslation.upsert({
            where: { categoryId_locale: { categoryId: id, locale: locale! } },
            update: {},
            create: { categoryId: id, locale: locale!, name: name!, slug: 'demo-' + code },
          });
      }
      const attributeId = demoId('attribute:weight');
      await tx.attribute.upsert({
        where: { id: attributeId },
        update: {},
        create: { id: attributeId, code: 'demo-weight', kind: 'NUMBER', unit: 'g' },
      });
      for (const [locale, name] of [
        ['fa', 'وزن آزمایشی'],
        ['en', 'Demo weight'],
      ])
        await tx.attributeTranslation.upsert({
          where: { attributeId_locale: { attributeId, locale: locale! } },
          update: {},
          create: { attributeId, locale: locale!, name: name! },
        });
      await tx.categoryAttribute.upsert({
        where: { categoryId_attributeId: { categoryId: demoId('category:audio'), attributeId } },
        update: {},
        create: { categoryId: demoId('category:audio'), attributeId },
      });
      for (const [code, category, fa, en] of [
        ['headphones', 'audio', 'هدفون آزمایشی', 'Demo headphones'],
        ['keyboard', 'workspace', 'کیبورد آزمایشی', 'Demo keyboard'],
        ['mouse', 'accessories', 'ماوس آزمایشی', 'Demo mouse'],
      ]) {
        const id = demoId('product:' + code);
        const existing = await tx.product.findUnique({ where: { id } });
        if (existing && !existing.isDemo)
          throw new Error('Demo identifier belongs to non-demo data');
        await tx.product.upsert({
          where: { id },
          update: {},
          create: { id, categoryId: demoId('category:' + category), isDemo: true, status: 'DRAFT' },
        });
        for (const [locale, name] of [
          ['fa', fa],
          ['en', en],
        ])
          await tx.productTranslation.upsert({
            where: { productId_locale: { productId: id, locale: locale! } },
            update: {},
            create: {
              productId: id,
              locale: locale!,
              name: name!,
              slug: 'demo-' + code,
              description:
                locale === 'fa'
                  ? 'صرفاً داده آزمایشی؛ قابل فروش نیست.'
                  : 'Test fixture only. Not for sale.',
            },
          });
        const mediaId = demoId('media:' + code);
        await tx.media.upsert({
          where: { id: mediaId },
          update: {},
          create: {
            id: mediaId,
            storageKey: `demo/${code}.webp`,
            mimeType: 'image/webp',
            byteSize: 1n,
            status: 'PENDING',
          },
        });
        await tx.productMedia.upsert({
          where: { productId_mediaId: { productId: id, mediaId } },
          update: {},
          create: { productId: id, mediaId },
        });
        let selections: { optionId: string; valueId: string }[] = [];
        if (code === 'headphones') {
          const optionId = demoId('option:finish');
          const valueId = demoId('value:silver');
          await tx.productOption.upsert({
            where: { id: optionId },
            update: {},
            create: { id: optionId, productId: id, code: 'finish' },
          });
          for (const [locale, name] of [
            ['fa', 'رنگ آزمایشی'],
            ['en', 'Demo finish'],
          ])
            await tx.optionTranslation.upsert({
              where: { optionId_locale: { optionId, locale: locale! } },
              update: {},
              create: { optionId, locale: locale!, name: name! },
            });
          await tx.optionValue.upsert({
            where: { id: valueId },
            update: {},
            create: { id: valueId, optionId, code: 'silver' },
          });
          for (const [locale, label] of [
            ['fa', 'نقره‌ای'],
            ['en', 'Silver'],
          ])
            await tx.optionValueTranslation.upsert({
              where: { valueId_locale: { valueId, locale: locale! } },
              update: {},
              create: { valueId, locale: locale!, label: label! },
            });
          selections = [{ optionId, valueId }];
          await tx.productAttributeValue.upsert({
            where: { productId_attributeId_locale: { productId: id, attributeId, locale: '*' } },
            update: {},
            create: { productId: id, attributeId, kind: 'NUMBER', numberValue: '100.000000' },
          });
        }
        const variantId = demoId('variant:' + code);
        await tx.variant.upsert({
          where: { id: variantId },
          update: {},
          create: {
            id: variantId,
            productId: id,
            sku: 'DEMO-' + code!.toUpperCase(),
            priceIrr: 1000000n,
            combinationKey: canonicalVariantKey(selections),
          },
        });
        for (const selection of selections)
          await tx.variantSelection.upsert({
            where: { variantId_optionId: { variantId, optionId: selection.optionId } },
            update: {},
            create: { variantId, productId: id, ...selection },
          });
        await tx.inventory.upsert({
          where: { variantId },
          update: {},
          create: { variantId, onHand: 12 },
        });
      }
      return { products: 3, variants: 3 };
    },
    { timeout: 15000 },
  );
}
