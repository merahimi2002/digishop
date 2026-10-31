'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, ArrowUpRight } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';

export function StoreMobileMenu() {
  const t = useTranslations('Shop');
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (
        menu.current?.open &&
        event.target instanceof Node &&
        !menu.current.contains(event.target)
      )
        menu.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        menu.current?.open &&
        menu.current.contains(document.activeElement)
      ) {
        menu.current.open = false;
        menu.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, []);
  return (
    <details className="mobile-menu" ref={menu}>
      <summary aria-label={t('menu')}>
        <Menu size={23} aria-hidden="true" />
      </summary>
      <nav aria-label={t('navigation')}>
        {[
          { href: '/collection', label: t('collectionNav') },
          { href: '/categories', label: t('categoriesNav') },
          { href: '/about', label: t('storyNav') },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={
              pathname === item.href ||
              (item.href === '/collection' && pathname.startsWith('/products/'))
                ? 'page'
                : undefined
            }
            onClick={() => {
              if (menu.current) menu.current.open = false;
            }}
          >
            {item.label}
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </details>
  );
}
