import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { formatPrice } from '@/lib/product-input';
import type { StoreProduct } from '@/server/catalog/storefront';
export async function StoreProducts({
  items,
  locale,
}: {
  items: StoreProduct[];
  locale: 'fa' | 'en';
}) {
  const t = await getTranslations({ locale, namespace: 'StoreCatalog' });
  if (!items.length) return <p className="store-empty">{t('empty')}</p>;
  return (
    <ul className="store-product-grid">
      {items.map((item) => (
        <li key={item.id}>
          <article>
            <p className="catalog-scope">
              {item.category}
              {item.brand ? ` · ${item.brand}` : ''}
            </p>
            <h2>
              <Link href={`/products/${item.slug}`}>{item.name}</Link>
            </h2>
            {item.isDemo && <span className="store-demo">{t('demo')}</span>}
            <p className="store-description">{item.description}</p>
            <p className="store-price">
              {t('fromPrice', { amount: formatPrice(item.variants[0]!.priceIrr, locale) })}
            </p>
            <p>{item.variants.some((v) => v.available > 0) ? t('inStock') : t('outOfStock')}</p>
            <Link className="editorial-link" href={`/products/${item.slug}`}>
              {t('details')}
            </Link>
          </article>
        </li>
      ))}
    </ul>
  );
}
