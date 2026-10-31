'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, Moon, Sun, Check } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { siteConfig } from '@/config/generated/site';
import { Link, usePathname } from '@/i18n/navigation';
import { PalettePicker } from './palette-picker';
import { LocaleFlag } from './locale-flag';

const subscribe = () => () => {};
export function SiteControls() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const pathname = usePathname();
  const search = useSearchParams();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const menu = useRef<HTMLDetailsElement>(null);
  const active = siteConfig.localization.locales.find((item) => item.code === locale)!;
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (
        menu.current?.open &&
        event.target instanceof Node &&
        !menu.current.contains(event.target)
      )
        menu.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, []);
  return (
    <div className="site-controls">
      <details ref={menu} className="language-picker">
        <summary aria-label={t('language')}>
          <LocaleFlag locale={locale} />
          <span>{active.label}</span>
          <ChevronDown size={13} aria-hidden="true" />
        </summary>
        <nav aria-label={t('language')}>
          {siteConfig.localization.locales.map((item) => (
            <Link
              key={item.code}
              href={{ pathname, query: Object.fromEntries(search.entries()) }}
              locale={item.code}
              hrefLang={item.code}
              lang={item.code}
              aria-current={locale === item.code ? 'page' : undefined}
              onClick={() => {
                if (menu.current) menu.current.open = false;
              }}
            >
              <LocaleFlag locale={item.code} />
              <span>{item.label}</span>
              {locale === item.code && <Check size={14} aria-hidden="true" />}
            </Link>
          ))}
        </nav>
      </details>
      <PalettePicker />
      <label className="theme-toggle" title={t('theme')}>
        <input
          type="checkbox"
          role="switch"
          aria-checked={mounted && resolvedTheme === 'dark'}
          aria-label={t('theme')}
          disabled={!mounted}
          checked={mounted && resolvedTheme === 'dark'}
          onChange={(event) => setTheme(event.target.checked ? 'dark' : 'light')}
        />
        <span className="toggle-track" aria-hidden="true">
          <Sun className="toggle-sun" size={14} />
          <Moon className="toggle-moon" size={14} />
          <span className="toggle-thumb" />
        </span>
      </label>
    </div>
  );
}
