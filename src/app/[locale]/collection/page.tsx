import { connection } from 'next/server';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { getDatabase } from '@/server/database/client';
import { readStorefront, storefrontQuery } from '@/server/catalog/storefront';
import { StoreProducts } from '@/components/catalog/store-products';
import { StorefrontMotion } from '@/components/storefront-motion';
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'StoreCatalog' });
  return { title: t('title') };
}
export default async function CollectionPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await connection();
  const t = await getTranslations('StoreCatalog');
  const parsed = storefrontQuery.safeParse(await searchParams);
  const query = parsed.success ? parsed.data : storefrontQuery.parse({});
  const data = await readStorefront(getDatabase(), locale, query);
  const href = (page: number) => ({
    pathname: '/collection',
    query: { q: query.q, category: query.category, page },
  });
  return (
    <main id="main" tabIndex={-1} className="interior-page shell store-catalog">
      <header className="page-heading">
        <h1>{t('title')}</h1>
        <p>{t('intro')}</p>
      </header>
      <form className="store-filters" action={`/${locale}/collection`}>
        <label className="product-field">
          <span>{t('search')}</span>
          <input name="q" defaultValue={query.q} maxLength={100} />
        </label>
        <label className="product-field">
          <span>{t('category')}</span>
          <select name="category" defaultValue={query.category}>
            <option value="">{t('all')}</option>
            {data.categories.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button className="action-primary">{t('apply')}</button>
        <Link href="/collection">{t('reset')}</Link>
      </form>
      {!parsed.success && <output>{t('invalidQuery')}</output>}
      <p>{t('total', { count: data.total })}</p>
      <StoreProducts items={data.items} locale={locale} />
      {data.pages > 1 && (
        <nav className="catalog-pagination" aria-label={t('pagination')}>
          {query.page > 1 && <Link href={href(query.page - 1)}>{t('previous')}</Link>}
          <span>
            {query.page} / {data.pages}
          </span>
          {query.page < data.pages && <Link href={href(query.page + 1)}>{t('next')}</Link>}
        </nav>
      )}
      <StorefrontMotion />
    </main>
  );
}
