import { Suspense } from 'react';
import { serverEnv } from '@/server/env';
import { HeaderAccount } from './auth/header-account';
import { getTranslations } from 'next-intl/server';
import { Search, ArrowUp } from 'lucide-react';
import { siteConfig, type Locale } from '@/config/generated/site';
import { Link } from '@/i18n/navigation';
import { BrandMark } from './brand-mark';
import { SiteControls } from './site-controls';
import { StoreNav } from './store-nav';
import { StoreMobileMenu } from './store-mobile-menu';

export async function StoreShell({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const t = await getTranslations({ locale, namespace: 'Shop' });
  const common = await getTranslations({ locale, namespace: 'Common' });
  const name = siteConfig.brand.names[locale];
  const links = [
    { href: '/collection', label: t('collectionNav') },
    { href: '/categories', label: t('categoriesNav') },
    { href: '/about', label: t('storyNav') },
  ];
  return (
    <div className="storefront" id="top">
      <a className="skip-link" href="#main">
        {common('skip')}
      </a>
      <div className="preview-bar">
        <span className="preview-dot" />
        {t('preview')}
      </div>
      <header className="store-header">
        <div className="header-main shell">
          <Link href="/" aria-label={`${name} — ${common('home')}`} className="brand-link">
            <BrandMark className="brand-icon" />
            <span>{name}</span>
          </Link>
          <StoreNav label={t('navigation')} links={links} />
          <div className="header-actions">
            <Link
              href="/collection#collection-search"
              className="search-trigger"
              aria-label={t('search')}
            >
              <Search size={20} aria-hidden="true" />
            </Link>
            <HeaderAccount enabled={serverEnv.AUTH_ENABLED} />
            <StoreMobileMenu />
            <Suspense fallback={<div className="controls-placeholder" aria-hidden="true" />}>
              <SiteControls />
            </Suspense>
          </div>
        </div>
        <div className="scroll-progress" aria-hidden="true" />
      </header>
      {children}
      <footer className="store-footer">
        <div className="footer-main shell">
          <div>
            <Link href="/" className="brand-link">
              <BrandMark className="brand-icon" />
              <span>{name}</span>
            </Link>
            <p className="footer-statement">{t('footerLine')}</p>
          </div>
          <nav aria-label={t('footerLinks')}>
            {links.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <a href="#top" className="back-top">
            {t('backTop')}
            <ArrowUp size={18} aria-hidden="true" />
          </a>
        </div>
        <div className="footer-bottom shell">
          <span>{name}</span>
          <span>{t('footerNote')}</span>
        </div>
      </footer>
    </div>
  );
}
