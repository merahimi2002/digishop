export function LocaleFlag({ locale }: { locale: string }) {
  if (locale === 'fa')
    return (
      <svg className="locale-flag" viewBox="0 0 30 20" aria-hidden="true">
        <rect width="30" height="20" fill="#fff" />
        <path fill="#239f40" d="M0 0h30v6.67H0z" />
        <path fill="#da0000" d="M0 13.33h30V20H0z" />
        <g fill="none" stroke="#da0000" strokeWidth=".65">
          <path d="M15 7.6v4.8m-2-4.2c-1.7 2.6-.4 4.4 2 4.5m2-4.5c1.7 2.6.4 4.4-2 4.5m-1.8-4.8c-.8 1.7.2 3.2 1.8 3.6m1.8-3.6c.8 1.7-.2 3.2-1.8 3.6" />
        </g>
      </svg>
    );
  if (locale === 'en')
    return (
      <svg className="locale-flag" viewBox="0 0 30 20" aria-hidden="true">
        <rect width="30" height="20" fill="#012169" />
        <path d="M0 0l30 20M30 0L0 20" stroke="#fff" strokeWidth="4" />
        <path d="M0 0l30 20M30 0L0 20" stroke="#c8102e" strokeWidth="1.4" />
        <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" />
        <path d="M15 0v20M0 10h30" stroke="#c8102e" strokeWidth="3.5" />
      </svg>
    );
  return (
    <span className="locale-fallback" aria-hidden="true">
      {locale.toUpperCase()}
    </span>
  );
}
