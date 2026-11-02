'use client';
import { Link, usePathname } from '@/i18n/navigation';
export function StoreNav({
  label,
  links,
}: {
  label: string;
  links: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  return (
    <nav className="desktop-nav" aria-label={label}>
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={
            pathname === item.href ||
            (item.href === '/collection' &&
              (pathname.startsWith('/products/') || pathname.startsWith('/preview/products/')))
              ? 'page'
              : undefined
          }
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
