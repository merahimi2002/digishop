'use client';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Eye, EyeOff, ArrowUpRight } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { clearPrivateQueries } from '@/lib/query-client';
import { authFormSchema, type AuthMode } from '@/lib/auth-input';
import { accountAction } from './client';
const submitLabels = {
  'sign-in': 'signIn',
  'sign-up': 'signUp',
  forgot: 'sendReset',
  reset: 'savePassword',
  verify: 'verifyEmail',
  resend: 'resend',
} as const;
type Values = { name: string; email: string; password: string; confirmation: string };
export function AuthForm({
  mode,
  enabled,
  localMail,
}: {
  mode: AuthMode;
  enabled: boolean;
  localMail: boolean;
}) {
  const t = useTranslations('Auth'),
    locale = useLocale(),
    router = useRouter(),
    client = useQueryClient();
  const [show, setShow] = useState(false),
    [token, setToken] = useState(''),
    [done, setDone] = useState(false),
    [error, setError] = useState('');
  const incomingToken = useRef<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(authFormSchema(mode)),
    defaultValues: { name: '', email: '', password: '', confirmation: '' },
  });
  useEffect(() => {
    if (incomingToken.current === null) {
      incomingToken.current = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';
      if (incomingToken.current)
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    const frame = requestAnimationFrame(() => setToken(incomingToken.current ?? ''));
    return () => cancelAnimationFrame(frame);
  }, []);
  const submit = handleSubmit(async (values) => {
    setError('');
    const route = {
      'sign-in': 'sign-in/email',
      'sign-up': 'sign-up/email',
      forgot: 'request-password-reset',
      resend: 'send-verification-email',
      reset: 'reset-password',
      verify: 'verify-email',
    }[mode];
    const body =
      mode === 'sign-up'
        ? { name: values.name, email: values.email, password: values.password }
        : mode === 'sign-in'
          ? { email: values.email, password: values.password }
          : mode === 'forgot' || mode === 'resend'
            ? { email: values.email }
            : mode === 'reset'
              ? { token, newPassword: values.password }
              : { token };
    try {
      await accountAction('/api/auth/' + route, body, locale);
      await clearPrivateQueries(client);
      if (mode === 'sign-in') {
        router.replace('/account');
        router.refresh();
      } else setDone(true);
    } catch (reason) {
      setError(
        reason instanceof Error && reason.message === 'RATE_LIMITED'
          ? t('rateError')
          : t('authError'),
      );
    }
  });
  if (!enabled) return <p className="auth-notice">{t('disabled')}</p>;
  if (done)
    return (
      <div className="auth-result" aria-live="polite">
        <p>
          {t(
            mode === 'sign-up' || mode === 'resend'
              ? 'verifySent'
              : mode === 'forgot'
                ? 'resetSent'
                : mode === 'verify'
                  ? 'verified'
                  : 'passwordReset',
          )}
        </p>
        {localMail && ['sign-up', 'forgot', 'resend'].includes(mode) && (
          <p className="auth-hint">{t('localMail')}</p>
        )}
        <Link href="/auth/sign-in" className="editorial-link">
          {t('signIn')}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
    );
  const field = (name: 'name' | 'email' | 'confirmation') => (
    <div className="auth-field" key={name}>
      <label htmlFor={'auth-' + name}>{t(name)}</label>
      <input
        id={'auth-' + name}
        type={
          name === 'email'
            ? 'email'
            : name === 'confirmation'
              ? show
                ? 'text'
                : 'password'
              : 'text'
        }
        dir={name === 'name' ? 'auto' : 'ltr'}
        autoComplete={name === 'email' ? 'email' : name === 'name' ? 'name' : 'new-password'}
        maxLength={name === 'name' ? 160 : name === 'email' ? 254 : 128}
        {...register(name)}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? 'auth-' + name + '-error' : undefined}
      />
      {errors[name] && (
        <p id={'auth-' + name + '-error'} className="field-error">
          {t(name === 'email' ? 'emailError' : name === 'name' ? 'nameError' : 'confirmationError')}
        </p>
      )}
    </div>
  );
  const needsToken = ['verify', 'reset'].includes(mode);
  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      {mode === 'sign-up' && field('name')}
      {['sign-in', 'sign-up', 'forgot', 'resend'].includes(mode) && field('email')}
      {['sign-in', 'sign-up', 'reset'].includes(mode) && (
        <div className="auth-field">
          <label htmlFor="auth-password">{t('password')}</label>
          <div className="password-field">
            <input
              id="auth-password"
              type={show ? 'text' : 'password'}
              dir="ltr"
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              maxLength={128}
              {...register('password')}
              aria-invalid={!!errors.password}
              aria-describedby="password-hint"
            />
            <button
              type="button"
              aria-label={t(show ? 'hidePassword' : 'showPassword')}
              aria-pressed={show}
              onClick={() => setShow((value) => !value)}
            >
              {show ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          <p id="password-hint" className={errors.password ? 'field-error' : 'auth-hint'}>
            {t(mode === 'sign-in' ? 'passwordManager' : 'passwordHint')}
          </p>
        </div>
      )}
      {['sign-up', 'reset'].includes(mode) && field('confirmation')}
      {needsToken && !token && <output className="field-error">{t('invalidLink')}</output>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="action-primary auth-submit"
        type="submit"
        disabled={isSubmitting || (needsToken && !token)}
      >
        {isSubmitting ? t('working') : t(submitLabels[mode])}
        <ArrowUpRight size={19} className="directional-icon" aria-hidden="true" />
      </button>
      {mode === 'sign-in' && (
        <>
          <Link href="/auth/forgot">{t('forgotPassword')}</Link>
          <Link href="/auth/resend">{t('resend')}</Link>
          <p>
            {t('noAccount')} <Link href="/auth/sign-up">{t('signUp')}</Link>
          </p>
        </>
      )}
      {mode === 'sign-up' && (
        <p>
          {t('hasAccount')} <Link href="/auth/sign-in">{t('signIn')}</Link>
        </p>
      )}
      {localMail && ['sign-up', 'forgot', 'resend'].includes(mode) && (
        <p className="auth-hint">{t('localMail')}</p>
      )}
    </form>
  );
}
