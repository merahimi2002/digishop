import { defineRouting } from 'next-intl/routing';
import { siteConfig } from '@/config/generated/site';

export const routing = defineRouting({
  locales: siteConfig.localization.locales.map((locale) => locale.code),
  defaultLocale: siteConfig.localization.defaultLocale,
  localePrefix: 'always',
  localeDetection: false,
});
