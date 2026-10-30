'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Errors');
  const common = useTranslations('Common');
  return (
    <main className="fallback-page">
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <Button onClick={reset}>{common('retry')}</Button>
    </main>
  );
}
