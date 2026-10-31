'use client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { UserRound } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { accountKey, getAccount } from './client';
export function HeaderAccount({ enabled }: { enabled: boolean }) {
  const t = useTranslations('Auth');
  const { data } = useQuery({
    queryKey: accountKey,
    queryFn: getAccount,
    enabled,
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: true,
  });
  return (
    <Link
      className="header-account"
      href={data?.user ? '/account' : '/auth/sign-in'}
      aria-label={t(data?.user ? 'myAccount' : 'signIn')}
      title={t(data?.user ? 'myAccount' : 'signIn')}
    >
      <UserRound size={20} aria-hidden="true" />
    </Link>
  );
}
