import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { redirect } from '@/i18n/navigation';
import { currentPrincipal } from '@/server/auth/session';
import { can } from '@/server/auth/policy';
import { ProductManager } from '@/components/catalog/product-manager';
export const metadata = { robots: { index: false, follow: false } };
export default async function ProductsAdmin({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const principal = await currentPrincipal();
  if (!principal) return redirect({ href: '/auth/sign-in', locale });
  if (!can(principal.user.role, 'catalog:write') || principal.user.mustChangePassword) notFound();
  return (
    <main id="main" tabIndex={-1} className="catalog-page shell">
      <ProductManager />
    </main>
  );
}
