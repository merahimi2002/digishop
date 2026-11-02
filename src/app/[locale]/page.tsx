import { SignatureHeading } from '@/components/signature-heading';
import { StorefrontMotion } from '@/components/storefront-motion';
import Image from 'next/image';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { ConceptCollection } from '@/components/concept-collection';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { connection } from 'next/server';
import { getDatabase } from '@/server/database/client';
import { readStorefront, storefrontQuery } from '@/server/catalog/storefront';
import { StoreProducts } from '@/components/catalog/store-products';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('Shop');
  const catalog = await getTranslations('StoreCatalog');
  await connection();
  const products = await readStorefront(getDatabase(), locale, storefrontQuery.parse({}));
  return (
    <main id="main" tabIndex={-1}>
      <section className="shop-hero shell" aria-labelledby="hero-title">
        <div className="hero-photo">
          <Image
            src="/images/collection/hero-headphones.webp"
            alt={t('heroAlt')}
            fill
            sizes="(max-width: 700px) 100vw, 60vw"
            loading="eager"
            fetchPriority="high"
          />
        </div>
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-editorial">
          <SignatureHeading as="h1" id="hero-title">
            <span>{t('heroLine1')}</span>
            <em>{t('heroLine2')}</em>
          </SignatureHeading>
          <p className="hero-description">{t('heroDescription')}</p>
          <div className="hero-actions">
            <Link href="/collection" className="action-primary">
              {t('heroExplore')}
              <ArrowUpRight size={21} className="directional-icon" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
      <section className="shell home-catalog" aria-labelledby="live-catalog-heading">
        <h2 id="live-catalog-heading">{catalog('title')}</h2>
        <StoreProducts items={products.items.slice(0, 4)} locale={locale} />
        <Link href="/collection" className="editorial-link">
          {catalog('viewCatalog')}
        </Link>
      </section>
      <aside className="shell preview-notice">
        <h2>{catalog('preview')}</h2>
        <p>{catalog('previewHelp')}</p>
      </aside>
      <ConceptCollection />
      <section
        className="perspective-section shell"
        id="perspective"
        aria-labelledby="perspective-title"
      >
        <div className="perspective-art" data-reveal>
          <Image
            src="/images/collection/keyboard.webp"
            alt={t('products.keyboard.alt')}
            fill
            sizes="(max-width: 700px) 90vw, 50vw"
          />
        </div>
        <div className="perspective-copy" data-reveal>
          <SignatureHeading as="h2" id="perspective-title">
            {t('storyTitle')}
          </SignatureHeading>
          <p>{t('storyText')}</p>
          <Link href="/collection" className="editorial-link">
            {t('storyLink')}
            <ArrowUpRight size={19} className="directional-icon" aria-hidden="true" />
          </Link>
        </div>
      </section>
      <StorefrontMotion />
    </main>
  );
}
