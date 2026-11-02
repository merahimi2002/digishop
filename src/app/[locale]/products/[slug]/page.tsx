import { connection } from 'next/server';
import { cache } from 'react';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { getDatabase } from '@/server/database/client';
import { readStoreProduct } from '@/server/catalog/storefront';
import { VariantPicker } from '@/components/catalog/variant-picker';
import { StorefrontMotion } from '@/components/storefront-motion';
const read = cache(async (locale: string, slug: string) => {
  await connection();
  return readStoreProduct(getDatabase(), locale, slug);
});
type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const product = await read(locale, slug);
  if (!product) notFound();
  return {
    title: product.name,
    description: product.description.slice(0, 320),
    ...(product.isDemo ? { robots: { index: false, follow: false } } : {}),
  };
}
export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const product = await read(locale, slug);
  if (!product) notFound();
  const t = await getTranslations('StoreCatalog');
  return (
    <main id="main" tabIndex={-1} className="product-page shell store-product-detail">
      <nav className="breadcrumbs" aria-label={t('breadcrumbs')}>
        <Link href="/">{t('home')}</Link>
        <span>/</span>
        <Link href="/collection">{t('title')}</Link>
      </nav>
      <div className="store-detail-grid">
        <section>
          <p className="catalog-scope">
            {product.category}
            {product.brand ? ` · ${product.brand}` : ''}
          </p>
          <h1>{product.name}</h1>
          {product.isDemo && <p className="store-demo">{t('demo')}</p>}
          <p className="store-detail-description">{product.description}</p>
          <nav className="store-translations" aria-label={t('languages')}>
            {routing.locales.map((language) => (
              <Link
                key={language}
                href={`/products/${product.localizedSlugs[language]}`}
                locale={language}
                hrefLang={language}
                aria-current={language === locale ? 'page' : undefined}
              >
                {language === 'fa' ? 'فارسی' : 'English'}
              </Link>
            ))}
          </nav>
        </section>
        <VariantPicker product={product} />
      </div>
      <StorefrontMotion />
    </main>
  );
}
