import { SignatureHeading } from '@/components/signature-heading';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default async function NotFound() {
  const t = await getTranslations('Errors');
  const common = await getTranslations('Common');
  return (
    <main id="main" tabIndex={-1} className="fallback-page">
      <p className="eyebrow">404</p>
      <SignatureHeading as="h1">{t('notFoundTitle')}</SignatureHeading>
      <p>{t('notFoundDescription')}</p>
      <Button asChild>
        <Link href="/">{common('home')}</Link>
      </Button>
    </main>
  );
}
