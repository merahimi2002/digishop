import { SignatureHeading } from '@/components/signature-heading';
import { StorefrontMotion } from '@/components/storefront-motion';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ConceptCollection } from '@/components/concept-collection';
import { isCategory } from '@/lib/concept-products';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ category?: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'Shop' });
  return { title: t('collectionNav'), description: t('collectionDescription') };
}
export default async function CollectionPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const requested = (await searchParams).category;
  const category = isCategory(requested) ? requested : 'all';
  const t = await getTranslations('Shop');
  const p = await getTranslations('Pages');
  return (
    <main id="main" tabIndex={-1} className="interior-page">
      <header className="page-heading shell" data-reveal>
        <p className="section-kicker">{t('collectionEyebrow')}</p>
        <SignatureHeading as="h1">{p('collectionTitle')}</SignatureHeading>
        <p>{t('collectionDescription')}</p>
      </header>
      <ConceptCollection key={category} showCategories={false} initialCategory={category} syncUrl />
      <StorefrontMotion />
    </main>
  );
}
