'use client';

import { SignatureHeading } from '@/components/signature-heading';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { ArrowUpRight, ArrowRight, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/navigation';
import {
  conceptProducts as objects,
  type Category,
  type ConceptProduct as Product,
} from '@/lib/concept-products';

export function ConceptCollection({
  showCategories = true,
  showCollection = true,
  initialCategory = 'all',
  syncUrl = false,
}: {
  showCategories?: boolean;
  showCollection?: boolean;
  initialCategory?: Category;
  syncUrl?: boolean;
}) {
  const t = useTranslations('Shop');
  const locale = useLocale();
  const router = useRouter();
  const [category, setCategoryState] = useState<Category>(initialCategory);
  const setCategory = (value: Category) => {
    setCategoryState(value);
    if (syncUrl)
      router.replace(
        { pathname: '/collection', query: value === 'all' ? {} : { category: value } },
        { scroll: false },
      );
  };
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const normalize = (value: string) =>
    value.normalize('NFKC').toLocaleLowerCase(locale).replace(/ي/g, 'ی').replace(/ك/g, 'ک');
  const visible = objects.filter(
    (product) =>
      (category === 'all' || product.category === category) &&
      normalize(`${t(`products.${product.id}.name`)} ${t(`products.${product.id}.type`)}`).includes(
        normalize(query.trim()),
      ),
  );
  useEffect(() => {
    if (!selected) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selected]);
  const categories = [
    { product: objects[0], title: t('categoryAudio'), subtitle: t('categoryAudioSub') },
    { product: objects[1], title: t('categoryWorkspace'), subtitle: t('categoryWorkspaceSub') },
    { product: objects[2], title: t('categoryAccessories'), subtitle: t('categoryAccessoriesSub') },
  ];
  return (
    <>
      {showCategories && (
        <section
          id="categories"
          className="discovery-section shell"
          aria-labelledby="discovery-heading"
        >
          <div className="section-intro" data-reveal>
            <div>
              <SignatureHeading as="h2" id="discovery-heading">
                {t('categoryTitle')}
              </SignatureHeading>
            </div>
            <p>{t('categoryDescription')}</p>
          </div>
          <div className="discovery-grid">
            {categories.map(({ product, title, subtitle }) => (
              <Link
                key={product.id}
                className={`discovery-card discovery-${product.category}`}
                href={{ pathname: '/collection', query: { category: product.category } }}
                data-reveal
              >
                <span className="discovery-copy">
                  <span className="discovery-subtitle">{subtitle}</span>
                  <strong>{title}</strong>
                  <span className="discovery-action">
                    {t('discover')}
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </span>
                </span>
                <span className="discovery-image">
                  <Image
                    src={product.image}
                    alt=""
                    fill
                    loading={!showCollection ? 'eager' : 'lazy'}
                    sizes="(max-width: 700px) 90vw, 32vw"
                  />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      {showCollection && (
        <section
          id="collection"
          className="collection-section shell"
          aria-labelledby="collection-heading"
        >
          <div className="section-intro" data-reveal>
            <div>
              <SignatureHeading as="h2" id="collection-heading">
                {t('collectionTitle')}
              </SignatureHeading>
            </div>
            <p>{t('collectionDescription')}</p>
          </div>
          <div className="collection-toolbar">
            <fieldset className="collection-filters">
              <legend className="sr-only">{t('filterLabel')}</legend>
              {(['all', 'audio', 'workspace', 'accessories'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={category === value}
                  onClick={() => setCategory(value)}
                >
                  {t(value)}
                </button>
              ))}
            </fieldset>
            <div className="collection-search">
              <Search size={17} aria-hidden="true" />
              <label className="sr-only" htmlFor="collection-search">
                {t('search')}
              </label>
              <input
                type="search"
                id="collection-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('searchPlaceholder')}
                autoComplete="off"
              />
              {query && (
                <button type="button" aria-label={t('clear')} onClick={() => setQuery('')}>
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          <div className="objects-grid" aria-live="polite" aria-atomic="false">
            {visible.map((product) => (
              <article className="object-card" key={product.id}>
                <Link
                  className={`object-image object-${product.id}`}
                  href={`/preview/products/${product.id}`}
                  aria-label={`${t('viewObject')} — ${t(`products.${product.id}.name`)}`}
                >
                  <span className="object-badge">{t('concept')}</span>
                  <Image
                    src={product.image}
                    alt={t(`products.${product.id}.alt`)}
                    fill
                    loading={!showCategories ? 'eager' : 'lazy'}
                    sizes="(max-width: 600px) 90vw, (max-width: 900px) 45vw, 30vw"
                  />
                  <span className="object-open" aria-hidden="true">
                    <ArrowUpRight size={23} />
                  </span>
                </Link>
                <div className="object-info">
                  <p>{t(`products.${product.id}.type`)}</p>
                  <h3>
                    <Link href={`/preview/products/${product.id}`}>
                      {t(`products.${product.id}.name`)}
                    </Link>
                  </h3>
                  <div className="object-meta">
                    <span>{t(`products.${product.id}.material`)}</span>
                    <button
                      className="quick-preview"
                      type="button"
                      onClick={() => setSelected(product)}
                      aria-label={`${t('quickView')} — ${t(`products.${product.id}.name`)}`}
                    >
                      {t('quickView')}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {!visible.length && (
            <div className="collection-empty">
              <Search size={28} aria-hidden="true" />
              <h3>{t('empty')}</h3>
              <output>{t('emptyText')}</output>
              <Button
                variant="outline"
                onClick={() => {
                  setCategory('all');
                  setQuery('');
                }}
              >
                {t('clear')}
              </Button>
            </div>
          )}
          <p className="concept-notice">{t('conceptNotice')}</p>
        </section>
      )}
      <dialog
        ref={dialog}
        className="object-dialog"
        aria-labelledby="object-dialog-title"
        aria-describedby="object-dialog-note"
        closedby="any"
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="dialog-layout">
            <button
              type="button"
              className="dialog-close"
              onClick={() => dialog.current?.close()}
              aria-label={t('close')}
            >
              <X size={21} />
            </button>
            <div className={`dialog-image object-${selected.id}`}>
              <Image
                src={selected.image}
                alt={t(`products.${selected.id}.alt`)}
                width={800}
                height={800}
                sizes="(max-width: 700px) 90vw, 45vw"
              />
            </div>
            <div className="dialog-copy">
              <p className="section-kicker">{t('detailLabel')}</p>
              <p className="dialog-type">{t(`products.${selected.id}.type`)}</p>
              <SignatureHeading as="h2" id="object-dialog-title">
                {t(`products.${selected.id}.name`)}
              </SignatureHeading>
              <p>{t(`products.${selected.id}.detail`)}</p>
              <div className="detail-finish">
                <span>{t('detailFinish')}</span>
                <strong>{t(`products.${selected.id}.material`)}</strong>
              </div>
              <p id="object-dialog-note" className="dialog-note">
                {t('detailNote')}
              </p>
              <Button variant="outline" onClick={() => dialog.current?.close()}>
                {t('close')}
                <ArrowRight size={16} className="directional-icon" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
