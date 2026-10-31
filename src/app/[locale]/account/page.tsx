import { hasLocale } from 'next-intl';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { redirect } from '@/i18n/navigation';
import { currentPrincipal } from '@/server/auth/session';
import { SignatureHeading } from '@/components/signature-heading';
import { AccountPanel } from '@/components/auth/account-panel';
export const metadata = { robots: { index: false, follow: false } };
export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  if (!(await currentPrincipal())) redirect({ href: '/auth/sign-in', locale });
  const t = await getTranslations('Auth');
  return (
    <main id="main" tabIndex={-1} className="account-page shell">
      <SignatureHeading as="h1">{t('myAccount')}</SignatureHeading>
      <AccountPanel />
    </main>
  );
}
