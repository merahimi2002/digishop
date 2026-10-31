import { SignatureHeading } from '@/components/signature-heading';
import { StorefrontMotion } from '@/components/storefront-motion';
import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { ArrowUpRight } from 'lucide-react';

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'Shop' });
  return { title: t('storyNav') };
}
export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('Shop');
  const p = await getTranslations('Pages');
  return (
    <main id="main" tabIndex={-1} className="interior-page">
      <header className="page-heading shell" data-reveal>
        <p className="section-kicker">{t('storyEyebrow')}</p>
        <SignatureHeading as="h1">{p('aboutTitle')}</SignatureHeading>
      </header>
      <section className="perspective-section shell" aria-labelledby="about-story">
        <div className="perspective-art" data-reveal>
          <Image
            src="/images/collection/keyboard.webp"
            alt={t('products.keyboard.alt')}
            fill
            loading="eager"
            sizes="(max-width:700px) 90vw, 50vw"
          />
        </div>
        <div className="perspective-copy" data-reveal>
          <SignatureHeading as="h2" id="about-story">
            {t('storyTitle')}
          </SignatureHeading>
          <p>{t('storyText')}</p>
          <Link href="/collection" className="editorial-link">
            {t('storyLink')}
            <ArrowUpRight className="directional-icon" size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <StorefrontMotion />
    </main>
  );
}
