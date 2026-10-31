import { SignatureHeading } from '@/components/signature-heading';
import { StorefrontMotion } from '@/components/storefront-motion';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ConceptCollection } from '@/components/concept-collection';

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'Shop' });
  return { title: t('categoriesNav') };
}
export default async function CategoriesPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const p = await getTranslations('Pages');
  const t = await getTranslations('Shop');
  return (
    <main id="main" tabIndex={-1} className="interior-page">
      <header className="page-heading shell" data-reveal>
        <p className="section-kicker">{t('categoryEyebrow')}</p>
        <SignatureHeading as="h1">{p('categoriesTitle')}</SignatureHeading>
        <p>{t('categoryDescription')}</p>
      </header>
      <ConceptCollection showCollection={false} />
      <StorefrontMotion />
    </main>
  );
}
