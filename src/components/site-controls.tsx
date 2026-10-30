'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from '@/components/theme-provider';
import { Globe2, Moon, Sun, Monitor } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { siteConfig } from '@/config/generated/site';
import { Link, usePathname } from '@/i18n/navigation';

const subscribe = () => () => {};

export function SiteControls() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return (
    <div className="site-controls">
      <nav aria-label={t('language')} className="control-group">
        <Globe2 size={16} aria-hidden="true" />
        {siteConfig.localization.locales.map((item) => (
          <Link
            key={item.code}
            href={pathname}
            locale={item.code}
            hrefLang={item.code}
            lang={item.code}
            aria-current={locale === item.code ? 'page' : undefined}
            className="control-option"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <fieldset className="control-group">
        <legend className="sr-only">{t('theme')}</legend>
        {(['light', 'dark', 'system'] as const).map((value) => {
          const Icon = value === 'light' ? Sun : value === 'dark' ? Moon : Monitor;
          return (
            <button
              key={value}
              type="button"
              className="theme-option"
              aria-label={t(value)}
              title={t(value)}
              aria-pressed={mounted && theme === value}
              onClick={() => setTheme(value)}
            >
              <Icon size={17} aria-hidden="true" />
            </button>
          );
        })}
      </fieldset>
    </div>
  );
}
