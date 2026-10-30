import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArrowUpRight, Languages, Eclipse, Layers3 } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { SiteControls } from '@/components/site-controls';
import { siteConfig } from '@/config/generated/site';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('Home');
  const common = await getTranslations('Common');
  const name = siteConfig.brand.names[locale];
  const features = [
    { icon: Languages, title: t('cardLanguage'), text: t('cardLanguageText') },
    { icon: Eclipse, title: t('cardTheme'), text: t('cardThemeText') },
    { icon: Layers3, title: t('cardNext'), text: t('cardNextText') },
  ];
  return (
    <>
      <a className="skip-link" href="#main">
        {common('skip')}
      </a>
      <div className="page-shell">
        <header className="site-header">
          <Link href="/" aria-label={`${name} — ${common('home')}`} className="brand-link">
            <BrandMark className="brand-icon" />
            <span>{name}</span>
          </Link>
          <SiteControls />
        </header>
        <main id="main" tabIndex={-1}>
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="eyebrow">
                <span className="status-dot" />
                {t('eyebrow')}
              </p>
              <h1 id="hero-title">{t('title')}</h1>
              <p className="hero-description">{t('description')}</p>
              <div className="phase-badge">
                <span>{t('phase')}</span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </div>
              <p className="preview-note">{t('note')}</p>
            </div>
            <div className="brand-stage" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="brand-tile">
                <BrandMark className="hero-mark" />
              </div>
              <span className="color-chip chip-green" />
              <span className="color-chip chip-base" />
              <div className="stage-caption">
                <span>{name}</span>
                <span className="caption-line" />
              </div>
            </div>
          </section>
          <section className="foundations" aria-labelledby="foundation-title">
            <div className="section-heading">
              <h2 id="foundation-title">{t('identity')}</h2>
              <p>{t('identityDescription')}</p>
            </div>
            <div className="feature-grid">
              {features.map(({ icon: Icon, title, text }) => (
                <article className="feature-card" key={title}>
                  <span className="feature-icon">
                    <Icon size={21} strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </section>
        </main>
        <footer className="site-footer">
          <span>{name}</span>
          <span>{t('footer')}</span>
        </footer>
      </div>
    </>
  );
}
