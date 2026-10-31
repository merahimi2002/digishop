import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { siteConfig } from '@/config/generated/site';
import { routing } from '@/i18n/routing';
import { Providers } from '@/components/providers';
import { StoreShell } from '@/components/store-shell';
import { serverEnv } from '@/server/env';
import '../globals.css';

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'Home' });
  const name = siteConfig.brand.names[locale];
  return {
    title: { default: name, template: `%s | ${name}` },
    description: siteConfig.brand.descriptions[locale] ?? t('description'),
    applicationName: name,
    icons: { icon: '/brand/mark.svg' },
    robots: {
      index: serverEnv.APP_ENV === 'production',
      follow: serverEnv.APP_ENV === 'production',
    },
    ...(siteConfig.brand.domain ? { metadataBase: new URL(siteConfig.brand.domain) } : {}),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const direction = siteConfig.localization.locales.find((item) => item.code === locale)!.direction;
  return (
    <html lang={locale} dir={direction} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script async src="/brand/theme-init.js" />
      </head>
      <body>
        <NextIntlClientProvider>
          <Providers>
            <StoreShell locale={locale}>{children}</StoreShell>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
