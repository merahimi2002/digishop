'use client';
import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Plus, Search, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import {
  catalogInput,
  catalogResources,
  type CatalogInput,
  type CatalogItem,
  type CatalogList,
  type CatalogResource,
} from '@/lib/catalog-input';
import { siteConfig } from '@/config/generated/site';
import { Link } from '@/i18n/navigation';
const languages = siteConfig.localization.locales;
const emptyTranslations = () =>
  languages.map((l) => ({ locale: l.code, name: '', description: '' }));
function blank(): CatalogInput {
  return {
    code: '',
    translations: emptyTranslations(),
    parentId: null,
    kind: 'TEXT',
    unit: '',
    categoryIds: [],
    choices: [],
  };
}
async function call(resource: CatalogResource, method = 'GET', body?: unknown, search = '') {
  const response = await fetch(`/api/admin/catalog/${resource}${search}`, {
    method,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'UNAVAILABLE');
  return result;
}
export function TaxonomyManager() {
  const t = useTranslations('Catalog'),
    locale = useLocale();
  const [resource, setResource] = useState<CatalogResource>('categories');
  const [search, setSearch] = useState(''),
    [q, setQ] = useState(''),
    [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CatalogItem | null>(null),
    [epoch, setEpoch] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState('');
  const query = useQuery<CatalogList>({
    queryKey: ['private', 'catalog', resource, q, page],
    queryFn: () => call(resource, 'GET', undefined, `?page=${page}&q=${encodeURIComponent(q)}`),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const discard = () => !dirty || window.confirm(t('discard'));
  function choose(item: CatalogItem | null) {
    if (!discard()) return;
    setDirty(false);
    setSelected(item);
    setEpoch((e) => e + 1);
  }
  const name = (row: { code: string; translations: { locale: string; name: string }[] }) =>
    row.translations.find((r) => r.locale === locale)?.name ?? row.code;
  return (
    <div className="catalog-workspace" data-ui>
      {notice && <output className="catalog-notice">{notice}</output>}
      <header className="catalog-title">
        <div>
          <p className="catalog-scope">{t('workspace')}</p>
          <h1>{t('title')}</h1>
          <p>{t('intro')}</p>
        </div>
        <Link href="/admin/products" className="editorial-link">
          {t('products')}
        </Link>
        <Link href="/account" className="editorial-link">
          {t('account')}
        </Link>
      </header>
      <nav className="catalog-tabs" aria-label={t('sections')}>
        {catalogResources.map((r) => (
          <button
            key={r}
            aria-pressed={resource === r}
            onClick={() => {
              if (!discard()) return;
              setResource(r);
              setSelected(null);
              setDirty(false);
              setEpoch((e) => e + 1);
              setPage(1);
              setQ('');
              setSearch('');
            }}
          >
            {t(r)}
          </button>
        ))}
      </nav>
      <div className="catalog-grid">
        <section className="catalog-list" aria-label={t(resource)}>
          <form
            className="catalog-search"
            onSubmit={(e) => {
              e.preventDefault();
              setQ(search);
              setPage(1);
            }}
          >
            <label className="sr-only" htmlFor="catalog-search">
              {t('search')}
            </label>
            <input
              id="catalog-search"
              value={search}
              maxLength={100}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search')}
            />
            <button aria-label={t('search')}>
              <Search size={18} />
            </button>
          </form>
          <div className="catalog-list-heading">
            <span>{t('total', { count: query.data?.total ?? 0 })}</span>
            <button type="button" onClick={() => query.refetch()}>
              {t('refresh')}
            </button>
            <button className="catalog-new" onClick={() => choose(null)}>
              <Plus size={16} />
              {t('create')}
            </button>
          </div>
          {query.isPending ? (
            <output className="catalog-state">{t('loading')}</output>
          ) : query.isError ? (
            <div className="catalog-state">
              <p role="alert">{t('loadError')}</p>
              <button onClick={() => query.refetch()}>{t('retry')}</button>
            </div>
          ) : (
            <>
              {!query.data.items.length && (
                <p className="catalog-state">{q ? t('noResults') : t('empty')}</p>
              )}
              <ul className="catalog-rows">
                {query.data.items.map((item) => (
                  <li key={item.id}>
                    <button aria-pressed={selected?.id === item.id} onClick={() => choose(item)}>
                      <span>
                        <strong>{name(item)}</strong>
                        <small dir="ltr">{item.code}</small>
                      </span>
                      <span className="catalog-row-detail">
                        {resource === 'attributes'
                          ? t(item.kind)
                          : t('references', { count: item.references })}
                        <span className="catalog-edit-label">{t('edit')}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {query.data.pages > 1 && (
                <nav className="catalog-pagination" aria-label={t('pagination')}>
                  <button
                    aria-label={t('previous')}
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <span>{t('page', { page, pages: query.data.pages })}</span>
                  <button
                    aria-label={t('next')}
                    disabled={page >= query.data.pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ArrowRight size={18} />
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
        <TaxonomyEditor
          key={`${resource}-${epoch}`}
          resource={resource}
          selected={selected}
          categories={query.data?.categories ?? []}
          onDirty={() => setDirty(true)}
          onSaved={(item) => {
            setNotice(t(item ? 'saved' : 'deleted'));
            setSelected(item);
            setDirty(false);
            setEpoch((e) => e + 1);
          }}
        />
      </div>
    </div>
  );
}
function TaxonomyEditor({
  resource,
  selected,
  categories,
  onDirty,
  onSaved,
}: {
  resource: CatalogResource;
  selected: CatalogItem | null;
  categories: CatalogList['categories'];
  onDirty: () => void;
  onSaved: (item: CatalogItem | null) => void;
}) {
  const t = useTranslations('Catalog'),
    locale = useLocale(),
    client = useQueryClient();
  const [value, setValue] = useState<CatalogInput>(() =>
    selected
      ? {
          ...selected,
          translations: selected.translations.map((r) => ({
            ...r,
            description: r.description ?? '',
          })),
          choices: selected.choices.map((c) => ({
            ...c,
            translations: c.translations.map((r) => ({ ...r, description: r.description ?? '' })),
          })),
        }
      : blank(),
  );
  const [status, setStatus] = useState(''),
    [error, setError] = useState(''),
    [deleting, setDeleting] = useState(false);
  function update(next: CatalogInput) {
    setValue(next);
    onDirty();
    setStatus('');
    setError('');
  }
  const mutation = useMutation({
    mutationFn: async (method: string) =>
      call(resource, method, {
        ...value,
        ...(selected ? { id: selected.id, revision: selected.revision } : {}),
      }),
    onSuccess: async (data) => {
      await client.invalidateQueries({ queryKey: ['private', 'catalog'] });
      onSaved(data.item ?? null);
    },
    onError: (e) => {
      setError(e.message);
      setDeleting(false);
    },
  });
  const errorText = (code: string) =>
    t(
      code === 'STALE_EDIT'
        ? 'stale'
        : code === 'DUPLICATE'
          ? 'duplicate'
          : code === 'INVALID_INPUT' || code === 'INVALID_CHOICE'
            ? 'invalid'
            : code === 'UNAUTHORIZED' || code === 'FORBIDDEN'
              ? 'unauthorized'
              : code === 'RATE_LIMITED'
                ? 'rateLimited'
                : code === 'CONFLICT'
                  ? 'inUse'
                  : 'saveError',
    );
  const name = (row: CatalogList['categories'][number]) =>
    row.translations.find((r) => r.locale === locale)?.name ?? row.code;
  const saving = mutation.isPending;
  return (
    <section className="catalog-editor" aria-labelledby="catalog-editor-title">
      <header>
        <h2 id="catalog-editor-title">
          {selected ? t('editTitle') : t('newTitle', { section: t(resource) })}
        </h2>
        <p>{t('translationHint')}</p>
      </header>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError('');
          const parsed = catalogInput.safeParse(value);
          if (!parsed.success) {
            setError('INVALID_INPUT');
            return;
          }
          mutation.mutate(selected ? 'PATCH' : 'POST');
        }}
      >
        <fieldset disabled={saving} className="catalog-fields">
          <label htmlFor="catalog-code">
            {t('code')}
            <input
              id="catalog-code"
              dir="ltr"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={80}
              value={value.code}
              onChange={(e) => update({ ...value, code: e.target.value })}
            />
            <small>{t('codeHint')}</small>
          </label>
          {resource === 'categories' && (
            <label htmlFor="catalog-parent">
              {t('parent')}
              <select
                id="catalog-parent"
                value={value.parentId ?? ''}
                onChange={(e) => update({ ...value, parentId: e.target.value || null })}
              >
                <option value="">{t('root')}</option>
                {categories
                  .filter((c) => c.id !== selected?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {name(c)}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {resource === 'attributes' && (
            <>
              <label htmlFor="catalog-kind">
                {t('kind')}
                <select
                  id="catalog-kind"
                  disabled={!!selected}
                  value={value.kind}
                  onChange={(e) =>
                    update({
                      ...value,
                      kind: e.target.value as CatalogInput['kind'],
                      unit: '',
                      choices: [],
                    })
                  }
                >
                  {(['TEXT', 'NUMBER', 'BOOLEAN', 'OPTION'] as const).map((k) => (
                    <option key={k} value={k}>
                      {t(k)}
                    </option>
                  ))}
                </select>
                {selected && <small>{t('kindHint')}</small>}
              </label>
              {value.kind === 'NUMBER' && (
                <label htmlFor="catalog-unit">
                  {t('unit')}
                  <input
                    id="catalog-unit"
                    maxLength={32}
                    value={value.unit}
                    onChange={(e) => update({ ...value, unit: e.target.value })}
                  />
                </label>
              )}
            </>
          )}
          <div className="catalog-translations">
            {languages.map((l) => {
              const row = value.translations.find((r) => r.locale === l.code)!;
              return (
                <fieldset key={l.code} className="catalog-language" dir={l.direction}>
                  <legend>{l.label}</legend>
                  <label htmlFor={`catalog-name-${l.code}`}>
                    {t('name')}
                    <input
                      id={`catalog-name-${l.code}`}
                      required
                      maxLength={160}
                      value={row.name}
                      onChange={(e) =>
                        update({
                          ...value,
                          translations: value.translations.map((r) =>
                            r.locale === l.code ? { ...r, name: e.target.value } : r,
                          ),
                        })
                      }
                    />
                  </label>
                  {resource === 'categories' && (
                    <>
                      <label htmlFor={`catalog-slug-${l.code}`}>
                        {t('slug')}
                        <input
                          id={`catalog-slug-${l.code}`}
                          required
                          maxLength={180}
                          value={row.slug ?? ''}
                          onChange={(e) =>
                            update({
                              ...value,
                              translations: value.translations.map((r) =>
                                r.locale === l.code ? { ...r, slug: e.target.value } : r,
                              ),
                            })
                          }
                        />
                      </label>
                      <label htmlFor={`catalog-description-${l.code}`}>
                        {t('description')}
                        <textarea
                          id={`catalog-description-${l.code}`}
                          maxLength={4000}
                          rows={3}
                          value={row.description}
                          onChange={(e) =>
                            update({
                              ...value,
                              translations: value.translations.map((r) =>
                                r.locale === l.code ? { ...r, description: e.target.value } : r,
                              ),
                            })
                          }
                        />
                      </label>
                    </>
                  )}
                </fieldset>
              );
            })}
          </div>
          {resource === 'attributes' && (
            <>
              <fieldset className="catalog-categories">
                <legend>{t('scope')}</legend>
                <p>{t('scopeHint')}</p>
                {!categories.length && <p>{t('noCategories')}</p>}
                {categories.map((c) => (
                  <label key={c.id}>
                    <input
                      type="checkbox"
                      value={c.id}
                      checked={value.categoryIds.includes(c.id)}
                      onChange={(e) =>
                        update({
                          ...value,
                          categoryIds: e.target.checked
                            ? [...value.categoryIds, c.id]
                            : value.categoryIds.filter((id) => id !== c.id),
                        })
                      }
                    />
                    {name(c)}
                  </label>
                ))}
              </fieldset>
              {value.kind === 'OPTION' && (
                <fieldset className="catalog-choices">
                  <legend>{t('choices')}</legend>
                  {value.choices.map((c, index) => (
                    <fieldset className="catalog-choice" key={c.id ?? index}>
                      <legend>{t('choiceNumber', { number: index + 1 })}</legend>
                      <label htmlFor={`choice-${index}-code`}>
                        {t('code')}
                        <input
                          id={`choice-${index}-code`}
                          required
                          dir="ltr"
                          pattern="[a-z0-9]+(-[a-z0-9]+)*"
                          maxLength={80}
                          value={c.code}
                          onChange={(e) =>
                            update({
                              ...value,
                              choices: value.choices.map((r, i) =>
                                i === index ? { ...r, code: e.target.value } : r,
                              ),
                            })
                          }
                        />
                      </label>
                      {languages.map((l) => (
                        <label key={l.code} htmlFor={`choice-${index}-${l.code}`}>
                          {l.label}
                          <input
                            id={`choice-${index}-${l.code}`}
                            required
                            dir={l.direction}
                            maxLength={160}
                            value={c.translations.find((r) => r.locale === l.code)?.name ?? ''}
                            onChange={(e) =>
                              update({
                                ...value,
                                choices: value.choices.map((r, i) =>
                                  i === index
                                    ? {
                                        ...r,
                                        translations: r.translations.map((tr) =>
                                          tr.locale === l.code
                                            ? { ...tr, name: e.target.value }
                                            : tr,
                                        ),
                                      }
                                    : r,
                                ),
                              })
                            }
                          />
                        </label>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          update({ ...value, choices: value.choices.filter((_, i) => i !== index) })
                        }
                      >
                        {t('removeChoice')}
                      </button>
                    </fieldset>
                  ))}
                  <button
                    type="button"
                    disabled={value.choices.length >= 40}
                    onClick={() =>
                      update({
                        ...value,
                        choices: [
                          ...value.choices,
                          { code: '', translations: emptyTranslations() },
                        ],
                      })
                    }
                  >
                    <Plus size={16} />
                    {t('addChoice')}
                  </button>
                </fieldset>
              )}
            </>
          )}
          {error && (
            <p className="catalog-error" role="alert">
              {errorText(error)}
              {error === 'UNAUTHORIZED' && <Link href="/auth/sign-in"> {t('signIn')}</Link>}
            </p>
          )}
          {status && <output>{status}</output>}
          <div className="catalog-form-actions">
            <button className="catalog-save" type="submit">
              {saving ? t('saving') : t('save')}
            </button>
            {selected && (
              <button className="catalog-delete" type="button" onClick={() => setDeleting(true)}>
                <Trash2 size={16} />
                {t('delete')}
              </button>
            )}
          </div>
          {selected && deleting && (
            <div className="catalog-confirm">
              <p>{t('deleteConfirm')}</p>
              <button type="button" onClick={() => mutation.mutate('DELETE')}>
                {t('confirmDelete')}
              </button>
              <button type="button" onClick={() => setDeleting(false)}>
                {t('cancel')}
              </button>
            </div>
          )}
        </fieldset>
      </form>
    </section>
  );
}
