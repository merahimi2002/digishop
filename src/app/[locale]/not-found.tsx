import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default async function NotFound() {
  const t = await getTranslations('Errors');
  const common = await getTranslations('Common');
  return (
    <main className="fallback-page">
      <p className="eyebrow">404</p>
      <h1>{t('notFoundTitle')}</h1>
      <p>{t('notFoundDescription')}</p>
      <Button asChild>
        <Link href="/">{common('home')}</Link>
      </Button>
    </main>
  );
}
