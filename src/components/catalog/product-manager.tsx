'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import {
  productInput,
  formatPrice,
  type ProductInput,
  type ProductItem,
  type ProductList,
} from '@/lib/product-input';
const translations = () =>
  (['fa', 'en'] as const).map((locale) => ({ locale, name: '', description: '' }));
const variant = (): ProductInput['variants'][number] => ({
  sku: '',
  priceIrr: '0',
  active: true,
  onHand: 0,
  selections: [],
});
const blank = (): ProductInput => ({
  categoryId: '',
  brandId: null,
  status: 'DRAFT',
  isDemo: false,
  translations: translations().map((t) => ({ ...t, slug: '' })),
  options: [],
  variants: [variant()],
});
const errorKeys = [
  'INVALID_INPUT',
  'UNAVAILABLE',
  'STALE_EDIT',
  'DUPLICATE',
  'CONFLICT',
  'VARIANT_IDENTITY',
  'OPTION_STRUCTURE',
  'RESERVED_STOCK',
  'REQUIRED_ATTRIBUTES',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'RATE_LIMITED',
  'CATEGORY_LIMIT',
] as const;
async function call(method = 'GET', body?: unknown, search = '') {
  const response = await fetch('/api/admin/catalog/products' + search, {
    method,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'UNAVAILABLE');
  return result;
}
export function ProductManager() {
  const t = useTranslations('ProductsAdmin'),
    locale = useLocale();
  const client = useQueryClient();
  const [page, setPage] = useState(1),
    [q, setQ] = useState('');
  const [draft, setDraft] = useState<ProductInput>(blank),
    [selected, setSelected] = useState<ProductItem | null>(null);
  const [dirty, setDirty] = useState(false),
    [notice, setNotice] = useState('');
  const query = useQuery<ProductList>({
    queryKey: ['private', 'products', page, q],
    queryFn: () => call('GET', undefined, `?page=${page}&q=${encodeURIComponent(q)}`),
    retry: false,
    refetchOnWindowFocus: false,
  });
  function edit(value: ProductInput) {
    setDraft(value);
    setDirty(true);
    setNotice('');
  }
  function choose(item: ProductItem | null) {
    if (dirty && !window.confirm(t('discard'))) return;
    setSelected(item);
    setDraft(item ? structuredClone(item) : blank());
    setDirty(false);
    setNotice('');
    mutation.reset();
  }
  const mutation = useMutation<{ item: ProductItem }, Error>({
    mutationFn: () =>
      call(selected ? 'PATCH' : 'POST', {
        ...draft,
        ...(selected ? { id: selected.id, revision: selected.revision } : {}),
      }),
    onSuccess: async ({ item }) => {
      setSelected(item);
      setDraft(structuredClone(item));
      setDirty(false);
      setNotice(t('saved'));
      await client.invalidateQueries({ queryKey: ['private', 'products'] });
    },
  });
  const name = (row: { code: string; translations: { locale: string; name: string }[] }) =>
    row.translations.find((x) => x.locale === locale)?.name ?? row.code;
  const patchVariant = (i: number, patch: Partial<ProductInput['variants'][number]>) =>
    edit({ ...draft, variants: draft.variants.map((v, n) => (n === i ? { ...v, ...patch } : v)) });
  function input(
    label: string,
    value: string | number,
    change: (value: string) => void,
    extra: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) {
    return (
      <label className="product-field">
        <span>{label}</span>
        <input value={value} onChange={(e) => change(e.target.value)} {...extra} />
      </label>
    );
  }
  function localized(
    rows: ProductInput['translations'],
    change: (rows: ProductInput['translations']) => void,
    slugs = false,
  ) {
    return (
      <div className="product-locales">
        {rows.map((tr, i) => (
          <fieldset key={tr.locale} dir={tr.locale === 'fa' ? 'rtl' : 'ltr'}>
            <legend>{tr.locale === 'fa' ? 'فارسی' : 'English'}</legend>
            {input(
              t('name'),
              tr.name,
              (name) => change(rows.map((x, n) => (n === i ? { ...x, name } : x))),
              { required: true, maxLength: 160 },
            )}
            {slugs && (
              <>
                {input(
                  t('slug'),
                  tr.slug ?? '',
                  (slug) => change(rows.map((x, n) => (n === i ? { ...x, slug } : x))),
                  { required: true, maxLength: 180 },
                )}
                <label className="product-field">
                  <span>{t('description')}</span>
                  <textarea
                    value={tr.description}
                    maxLength={4000}
                    onChange={(e) =>
                      change(
                        rows.map((x, n) => (n === i ? { ...x, description: e.target.value } : x)),
                      )
                    }
                  />
                </label>
              </>
            )}
          </fieldset>
        ))}
      </div>
    );
  }
  return (
    <div className="catalog-workspace" data-ui>
      <header className="catalog-title">
        <div>
          <p className="catalog-scope">{t('workspace')}</p>
          <h1>{t('title')}</h1>
          <p>{t('intro')}</p>
        </div>
        <Link href="/admin" className="editorial-link">
          {t('taxonomy')}
        </Link>
      </header>
      <div className="catalog-grid product-admin-grid">
        <section className="catalog-list" aria-label={t('title')}>
          <form
            className="catalog-search"
            onSubmit={(e) => {
              e.preventDefault();
              if (dirty && !window.confirm(t('discard'))) return;
              const data = new FormData(e.currentTarget);
              setQ(String(data.get('q') ?? ''));
              setPage(1);
              setDirty(false);
            }}
          >
            <input name="q" aria-label={t('search')} maxLength={100} />
            <button aria-label={t('search')}>
              <Search size={18} aria-hidden="true" />
            </button>
          </form>
          <div className="catalog-list-heading">
            <span>{t('total', { count: query.data?.total ?? 0 })}</span>
            <button onClick={() => choose(null)}>{t('create')}</button>
            <button onClick={() => query.refetch()}>{t('refresh')}</button>
          </div>
          {query.isPending ? (
            <output>{t('loading')}</output>
          ) : query.isError ? (
            <p role="alert">{t('loadError')}</p>
          ) : (
            <>
              {!query.data.items.length && <p className="catalog-state">{t('empty')}</p>}
              <ul className="catalog-rows">
                {query.data.items.map((item) => (
                  <li key={item.id}>
                    <button
                      aria-label={
                        item.translations.find((x) => x.locale === locale)?.name ?? item.id
                      }
                      aria-pressed={selected?.id === item.id}
                      onClick={() => choose(item)}
                    >
                      <span>
                        <strong>
                          {item.translations.find((x) => x.locale === locale)?.name ??
                            item.variants[0]?.sku ??
                            item.id}
                        </strong>
                        <small>
                          {t(item.status)} · {item.variants.length} {t('variants')}
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {query.data.pages > 1 && (
                <nav className="catalog-pagination" aria-label={t('pagination')}>
                  <button
                    disabled={page <= 1}
                    onClick={() => {
                      if (!dirty || window.confirm(t('discard'))) {
                        setPage(page - 1);
                        setDirty(false);
                      }
                    }}
                  >
                    {t('previous')}
                  </button>
                  <span>
                    {page} / {query.data.pages}
                  </span>
                  <button
                    disabled={page >= query.data.pages}
                    onClick={() => {
                      if (!dirty || window.confirm(t('discard'))) {
                        setPage(page + 1);
                        setDirty(false);
                      }
                    }}
                  >
                    {t('next')}
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
        <form
          className="catalog-editor product-editor"
          onSubmit={(e) => {
            e.preventDefault();
            if (!productInput.safeParse(draft).success) {
              setNotice(t('INVALID_INPUT'));
              return;
            }
            mutation.mutate();
          }}
        >
          <fieldset disabled={mutation.isPending || !query.data}>
            <div className="product-editor-heading">
              <h2>{selected ? t('edit') : t('create')}</h2>
              {selected && <span>{t(selected.status)}</span>}
            </div>
            <div className="product-basic-fields">
              <label className="product-field">
                <span>{t('category')}</span>
                <select
                  required
                  value={draft.categoryId}
                  onChange={(e) => edit({ ...draft, categoryId: e.target.value })}
                >
                  <option value="">{t('choose')}</option>
                  {query.data?.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {name(c)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="product-field">
                <span>{t('brand')}</span>
                <select
                  value={draft.brandId ?? ''}
                  onChange={(e) => edit({ ...draft, brandId: e.target.value || null })}
                >
                  <option value="">{t('none')}</option>
                  {query.data?.brands.map((c) => (
                    <option key={c.id} value={c.id}>
                      {name(c)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {localized(
              draft.translations,
              (translations) => edit({ ...draft, translations }),
              true,
            )}
            <section className="product-options">
              <h2>{t('options')}</h2>
              <p>{t('optionHelp')}</p>
              {draft.options.map((o, i) => {
                const update = (patch: Partial<typeof o>) =>
                  edit({
                    ...draft,
                    options: draft.options.map((x, n) => (n === i ? { ...x, ...patch } : x)),
                  });
                return (
                  <fieldset className="product-option" key={i}>
                    <legend>
                      {t('option')} {i + 1}
                    </legend>
                    {input(t('code'), o.code, (code) => update({ code }), {
                      required: true,
                      disabled: !!selected,
                      pattern: '[a-z0-9]+(-[a-z0-9]+)*',
                    })}
                    {localized(o.translations, (translations) => update({ translations }))}
                    {o.values.map((v, j) => (
                      <div className="product-option-value" key={j}>
                        {input(
                          t('valueCode'),
                          v.code,
                          (code) =>
                            update({
                              values: o.values.map((x, n) => (n === j ? { ...x, code } : x)),
                            }),
                          {
                            required: true,
                            disabled:
                              j <
                              (selected?.options.find((x) => x.code === o.code)?.values.length ??
                                0),
                            pattern: '[a-z0-9]+(-[a-z0-9]+)*',
                          },
                        )}
                        {localized(v.translations, (translations) =>
                          update({
                            values: o.values.map((x, n) => (n === j ? { ...x, translations } : x)),
                          }),
                        )}
                      </div>
                    ))}
                    <>
                      <button
                        type="button"
                        disabled={o.values.length >= 40}
                        onClick={() =>
                          update({
                            values: [...o.values, { code: '', translations: translations() }],
                          })
                        }
                      >
                        {t('addValue')}
                      </button>
                      {!selected && (
                        <button
                          type="button"
                          onClick={() =>
                            edit({
                              ...draft,
                              options: draft.options.filter((_, n) => n !== i),
                              variants: draft.variants.map((v) => ({ ...v, selections: [] })),
                            })
                          }
                        >
                          {t('removeOption')}
                        </button>
                      )}
                    </>
                  </fieldset>
                );
              })}
              {!selected && (
                <button
                  type="button"
                  disabled={draft.options.length >= 3}
                  onClick={() =>
                    edit({
                      ...draft,
                      options: [
                        ...draft.options,
                        {
                          code: '',
                          translations: translations(),
                          values: [{ code: '', translations: translations() }],
                        },
                      ],
                    })
                  }
                >
                  {t('addOption')}
                </button>
              )}
            </section>
            <section>
              <h2>{t('variants')}</h2>
              <p>{t('stockHelp')}</p>
              {draft.variants.map((v, i) => (
                <fieldset className="product-variant" key={v.id ?? i}>
                  <legend>
                    {t('variant')} {i + 1}
                  </legend>
                  <div className="product-basic-fields">
                    {input(t('sku'), v.sku, (sku) => patchVariant(i, { sku }), {
                      required: true,
                      maxLength: 80,
                      dir: 'ltr',
                    })}
                    {input(t('priceIrr'), v.priceIrr, (priceIrr) => patchVariant(i, { priceIrr }), {
                      required: true,
                      inputMode: 'numeric',
                      pattern: '[0-9]+',
                      dir: 'ltr',
                    })}
                    {input(
                      t('onHand'),
                      v.onHand,
                      (value) => patchVariant(i, { onHand: Number(value) }),
                      { required: true, type: 'number', min: 0, max: 2147483647 },
                    )}
                  </div>
                  <p className="product-price-preview">
                    {/^\d{1,19}$/.test(v.priceIrr)
                      ? t('toman', { amount: formatPrice(v.priceIrr, locale) })
                      : '—'}
                    {selected?.variants.find((x) => x.id === v.id) &&
                      ` · ${t('reserved')}: ${selected.variants.find((x) => x.id === v.id)!.reserved}`}
                  </p>
                  <div className="product-basic-fields">
                    {draft.options.map((o) => (
                      <label className="product-field" key={o.code}>
                        <span>{name(o)}</span>
                        <select
                          required
                          disabled={!!v.id}
                          value={v.selections.find((s) => s.option === o.code)?.value ?? ''}
                          onChange={(e) =>
                            patchVariant(i, {
                              selections: [
                                ...v.selections.filter((s) => s.option !== o.code),
                                { option: o.code, value: e.target.value },
                              ],
                            })
                          }
                        >
                          <option value="">{t('choose')}</option>
                          {o.values.map((x) => (
                            <option key={x.code} value={x.code}>
                              {name(x)}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                  <label className="product-check">
                    <input
                      type="checkbox"
                      checked={v.active}
                      onChange={(e) => patchVariant(i, { active: e.target.checked })}
                    />
                    {t('active')}
                  </label>
                  {!v.id && draft.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        edit({ ...draft, variants: draft.variants.filter((_, n) => n !== i) })
                      }
                    >
                      {t('removeVariant')}
                    </button>
                  )}
                </fieldset>
              ))}
              <button
                type="button"
                disabled={draft.variants.length >= 100 || !draft.options.length}
                onClick={() => edit({ ...draft, variants: [...draft.variants, variant()] })}
              >
                {t('addVariant')}
              </button>
            </section>
            <section className="product-publish">
              <h2>{t('publication')}</h2>
              <label className="product-field">
                <span>{t('status')}</span>
                <select
                  value={draft.status}
                  onChange={(e) =>
                    edit({ ...draft, status: e.target.value as ProductInput['status'] })
                  }
                >
                  {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).map((s) => (
                    <option key={s} value={s}>
                      {t(s)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="product-check">
                <input
                  type="checkbox"
                  checked={draft.isDemo}
                  onChange={(e) => edit({ ...draft, isDemo: e.target.checked })}
                />
                {t('demo')}
              </label>
              <p>{t('publishHelp')}</p>
            </section>
            <div className="product-save">
              <button
                type="submit"
                className="action-primary"
                disabled={!dirty || mutation.isPending}
              >
                {mutation.isPending ? t('saving') : t('save')}
              </button>
              {selected?.status === 'PUBLISHED' && (
                <Link
                  href={`/products/${selected.translations.find((t) => t.locale === locale)!.slug}`}
                >
                  {t('viewStore')}
                </Link>
              )}
            </div>
          </fieldset>
          {notice && <output className="catalog-notice">{notice}</output>}
          {mutation.isError && (
            <p role="alert">
              {t(errorKeys.find((key) => key === mutation.error.message) ?? 'UNAVAILABLE')}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
