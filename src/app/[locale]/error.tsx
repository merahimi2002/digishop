'use client';

import { SignatureHeading } from '@/components/signature-heading';

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
    <main id="main" tabIndex={-1} className="fallback-page">
      <SignatureHeading as="h1">{t('title')}</SignatureHeading>
      <p>{t('description')}</p>
      <Button onClick={reset}>{common('retry')}</Button>
    </main>
  );
}
