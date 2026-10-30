import { getTranslations } from 'next-intl/server';

export default async function Loading() {
  const t = await getTranslations('Common');
  return (
    <main className="fallback-page">
      <div className="loading-shape" aria-hidden="true" />
      <output>{t('loading')}</output>
    </main>
  );
}
