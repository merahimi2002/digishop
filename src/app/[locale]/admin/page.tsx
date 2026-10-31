import { hasLocale } from 'next-intl';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { redirect, Link } from '@/i18n/navigation';
import { currentPrincipal } from '@/server/auth/session';
import { can } from '@/server/auth/policy';
import { SignatureHeading } from '@/components/signature-heading';
export const metadata = { robots: { index: false, follow: false } };
export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const principal = await currentPrincipal();
  if (!principal) return redirect({ href: '/auth/sign-in', locale });
  if (!can(principal.user.role, 'catalog:write') || principal.user.mustChangePassword) notFound();
  const t = await getTranslations('Auth');
  return (
    <main id="main" tabIndex={-1} className="account-page shell">
      <SignatureHeading as="h1">{t('adminTitle')}</SignatureHeading>
      <p>{t('adminReady')}</p>
      <Link href="/account" className="editorial-link">
        {t('myAccount')}
      </Link>
    </main>
  );
}
