export type Theme = 'light' | 'dark' | 'system';

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}

// Self-contained: serialized by the config generator as an external pre-hydration script.
export function initializeTheme(defaultTheme: Theme) {
  let theme = defaultTheme;
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') theme = saved;
  } catch {
    /* Storage can be unavailable; the configured default still works. */
  }
  const resolved =
    theme === 'system'
      ? matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;
  const root = document.documentElement;
  try {
    const palette = localStorage.getItem('palette');
    if (palette && ['original', 'violet', 'ocean', 'rose'].includes(palette))
      root.dataset.palette = palette;
  } catch {
    /* Palette remains at its default. */
  }
  root.dataset.themePreference = theme;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}
