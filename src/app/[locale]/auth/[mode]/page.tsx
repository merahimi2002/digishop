import { hasLocale } from 'next-intl';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import { authModes, type AuthMode } from '@/lib/auth-input';
import { serverEnv } from '@/server/env';
import { AuthForm } from '@/components/auth/auth-form';
import { SignatureHeading } from '@/components/signature-heading';
type Props = { params: Promise<{ locale: string; mode: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'Auth' });
  return { title: t('myAccount'), robots: { index: false, follow: false } };
}
export default async function AuthPage({ params }: Props) {
  const { locale, mode } = await params;
  if (!hasLocale(routing.locales, locale) || !authModes.includes(mode as AuthMode)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('Auth');
  const heading = {
    'sign-in': 'signInTitle',
    'sign-up': 'signUpTitle',
    forgot: 'forgotTitle',
    reset: 'resetTitle',
    verify: 'verifyTitle',
    resend: 'resendTitle',
  } as const;
  return (
    <main id="main" tabIndex={-1} className="auth-layout shell">
      <div className="auth-intro">
        <SignatureHeading as="h1">{t(heading[mode as AuthMode])}</SignatureHeading>
        <p>{t('intro')}</p>
      </div>
      <section className="auth-surface" aria-label={t('myAccount')}>
        <AuthForm
          key={mode}
          mode={mode as AuthMode}
          enabled={serverEnv.AUTH_ENABLED}
          localMail={serverEnv.AUTH_EMAIL_TRANSPORT === 'local'}
        />
      </section>
    </main>
  );
}
