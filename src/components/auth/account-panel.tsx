'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { clearPrivateQueries } from '@/lib/query-client';
import { accountKey, getAccount, accountAction, type AccountData } from './client';
export function AccountPanel() {
  const t = useTranslations('Auth');
  const query = useQuery({
    queryKey: accountKey,
    queryFn: getAccount,
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: true,
  });
  if (query.isPending) return <output>{t('working')}</output>;
  if (query.isError) return <p role="alert">{t('authError')}</p>;
  if (!query.data.user)
    return (
      <div aria-live="polite">
        <p>{t('expired')}</p>
        <Link href="/auth/sign-in">{t('signIn')}</Link>
      </div>
    );
  return <AccountDetails data={query.data} />;
}
function AccountDetails({ data }: { data: AccountData }) {
  const user = data.user!,
    t = useTranslations('Auth'),
    locale = useLocale(),
    client = useQueryClient(),
    router = useRouter();
  const [name, setName] = useState(user.name),
    [current, setCurrent] = useState(''),
    [password, setPassword] = useState(''),
    [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState('');
  const act = async (path: string, body: unknown, method = 'POST') => {
    setBusy(true);
    setStatus('');
    try {
      await accountAction(path, body, locale, method);
      await client.invalidateQueries({ queryKey: accountKey });
      setStatus(t('saved'));
      return true;
    } catch (reason) {
      if (reason instanceof Error && reason.message === 'SESSION_EXPIRED') {
        await clearPrivateQueries(client);
        router.replace('/auth/sign-in');
        router.refresh();
      }
      setStatus(t('authError'));
      return false;
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="account-grid">
      <section className="auth-surface">
        <h2>{t('profile')}</h2>
        <p dir="ltr" className="account-email">
          {user.email}
        </p>
        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault();
            await act('/api/account', { name }, 'PATCH');
          }}
        >
          <div className="auth-field">
            <label htmlFor="account-name">{t('name')}</label>
            <input
              id="account-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              minLength={2}
              maxLength={160}
              required
            />
          </div>
          <button className="account-button" disabled={busy}>
            {t('saveProfile')}
          </button>
        </form>
        {(user.role === 'OWNER' || user.role === 'ADMIN') && !user.mustChangePassword && (
          <Link href="/admin" className="editorial-link">
            {t('adminTitle')}
          </Link>
        )}
        <button
          className="account-button secondary"
          disabled={busy}
          onClick={async () => {
            if (await act('/api/auth/sign-out', {})) {
              await clearPrivateQueries(client);
              router.replace('/auth/sign-in');
              router.refresh();
            }
          }}
        >
          {t('signOut')}
        </button>
      </section>
      <section className="auth-surface">
        <h2>{t('changePassword')}</h2>
        {user.mustChangePassword && <output>{t('mustChangePassword')}</output>}
        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (password !== confirmation) {
              setStatus(t('confirmationError'));
              return;
            }
            if (
              await act('/api/auth/change-password', {
                currentPassword: current,
                newPassword: password,
              })
            ) {
              setCurrent('');
              setPassword('');
              setConfirmation('');
              router.refresh();
            }
          }}
        >
          <div className="auth-field">
            <label htmlFor="current-password">{t('currentPassword')}</label>
            <input
              id="current-password"
              type="password"
              dir="ltr"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              maxLength={128}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="new-password">{t('newPassword')}</label>
            <input
              id="new-password"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={12}
              maxLength={128}
              aria-describedby="account-password-hint"
              required
            />
            <p id="account-password-hint" className="auth-hint">
              {t('passwordHint')}
            </p>
          </div>
          <div className="auth-field">
            <label htmlFor="confirm-password">{t('confirmation')}</label>
            <input
              id="confirm-password"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              minLength={12}
              maxLength={128}
              required
            />
          </div>
          <button className="account-button" disabled={busy}>
            {t('savePassword')}
          </button>
        </form>
      </section>
      <section className="auth-surface account-sessions">
        <h2>{t('sessions')}</h2>
        <p>{t('sessionLifetime')}</p>
        <ul>
          {data.sessions?.map((session) => (
            <li key={session.id}>
              <span>
                {session.current ? t('currentSession') : t('otherSession')}
                <time dateTime={session.createdAt}>
                  {new Intl.DateTimeFormat(locale, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(session.createdAt))}
                </time>
              </span>
              {!session.current && (
                <button
                  className="account-button secondary"
                  disabled={busy}
                  onClick={() => act('/api/account/sessions', { id: session.id }, 'DELETE')}
                >
                  {t('revoke')}
                </button>
              )}
            </li>
          ))}
        </ul>
        <button
          className="account-button secondary"
          disabled={busy}
          onClick={() => act('/api/auth/revoke-other-sessions', {})}
        >
          {t('revokeOthers')}
        </button>
      </section>
      <output className="account-status">{status}</output>
    </div>
  );
}
