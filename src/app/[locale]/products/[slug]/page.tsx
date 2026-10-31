import { SignatureHeading } from '@/components/signature-heading';
import { StorefrontMotion } from '@/components/storefront-motion';
import type { Metadata } from 'next';
import Image from 'next/image';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { getConceptProduct, conceptProducts } from '@/lib/concept-products';

type Props = { params: Promise<{ locale: string; slug: string }> };
// The design preview intentionally has only these concept routes (no live catalog yet).
export const dynamicParams = false;
export function generateStaticParams() {
  return conceptProducts.map((product) => ({ slug: product.id }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = getConceptProduct(slug);
  if (!hasLocale(routing.locales, locale) || !product) notFound();
  const t = await getTranslations({ locale, namespace: 'Shop' });
  return {
    title: t(`products.${product.id}.name`),
    description: t(`products.${product.id}.detail`),
  };
}
export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  const product = getConceptProduct(slug);
  if (!hasLocale(routing.locales, locale) || !product) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('Shop');
  const p = await getTranslations('Pages');
  return (
    <main id="main" tabIndex={-1} className="product-page shell">
      <nav className="breadcrumbs" aria-label={p('productLabel')}>
        <Link href="/">{p('home')}</Link>
        <span aria-hidden="true">/</span>
        <Link href="/collection">{t('collectionNav')}</Link>
        <span aria-hidden="true">/</span>
        <span>{t(`products.${product.id}.type`)}</span>
      </nav>
      <section className="product-layout" aria-labelledby="product-title">
        <div className={`product-gallery object-${product.id}`} data-reveal>
          <Image
            src={`/images/collection/detail-${product.id}.webp`}
            alt={t(`products.${product.id}.alt`)}
            width={900}
            height={900}
            loading="eager"
            sizes="(max-width:700px) 90vw,50vw"
          />
        </div>
        <div className="product-copy" data-reveal>
          <p className="section-kicker">{p('productLabel')}</p>
          <p className="dialog-type">{t(`products.${product.id}.type`)}</p>
          <SignatureHeading as="h1" id="product-title">
            {t(`products.${product.id}.name`)}
          </SignatureHeading>
          <p>{t(`products.${product.id}.detail`)}</p>
          <div className="detail-finish">
            <span>{t('detailFinish')}</span>
            <strong>{t(`products.${product.id}.material`)}</strong>
          </div>
          <p className="product-note">{t('detailNote')}</p>
          <Link href="/collection" className="editorial-link">
            {p('backCollection')}
            <ArrowUpRight size={18} className="directional-icon" aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className="related-concepts" aria-labelledby="related-heading">
        <SignatureHeading as="h2" id="related-heading">
          {p('relatedTitle')}
        </SignatureHeading>
        <div>
          {conceptProducts
            .filter((item) => item.id !== product.id)
            .map((item) => (
              <Link href={`/products/${item.id}`} key={item.id}>
                <Image
                  src={item.image}
                  alt={t(`products.${item.id}.alt`)}
                  width={160}
                  height={130}
                />
                <span>{t(`products.${item.id}.name`)}</span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            ))}
        </div>
      </section>
      <StorefrontMotion />
    </main>
  );
}
