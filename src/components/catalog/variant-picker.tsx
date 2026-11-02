'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { StoreProduct } from '@/server/catalog/storefront';
import { formatPrice } from '@/lib/product-input';
export function VariantPicker({ product }: { product: StoreProduct }) {
  const t = useTranslations('StoreCatalog'),
    locale = useLocale();
  const [selected, setSelected] = useState(product.variants[0]!.id);
  const variant = product.variants.find((v) => v.id === selected)!;
  const label = (v: typeof variant) =>
    v.selections
      .map((s) => {
        const o = product.options.find((o) => o.code === s.option)!;
        return `${o.name}: ${o.values.find((x) => x.code === s.value)!.name}`;
      })
      .join(' · ') || t('standard');
  return (
    <section className="store-variant-picker" aria-label={t('variants')}>
      <label className="product-field">
        <span>{t('variants')}</span>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {product.variants.map((v) => (
            <option key={v.id} value={v.id}>
              {label(v)}
            </option>
          ))}
        </select>
      </label>
      <div aria-live="polite" aria-atomic="true">
        <p className="store-price">
          {t('price', { amount: formatPrice(variant.priceIrr, locale) })}
        </p>
        <p>
          {t('sku')}: <bdi>{variant.sku}</bdi>
        </p>
        <p>
          {variant.available > 0 ? t('available', { count: variant.available }) : t('outOfStock')}
        </p>
      </div>
      <p className="product-note">{t('checkoutPending')}</p>
    </section>
  );
}
