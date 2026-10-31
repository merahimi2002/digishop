'use client';

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from 'react';
import { siteConfig } from '@/config/generated/site';
import { isTheme, type Theme } from '@/lib/theme';

const themeEvent = 'digishop:theme-change';
const mediaQuery = '(prefers-color-scheme: dark)';
const defaultTheme = siteConfig.appearance.defaultTheme;
let inMemoryPreference: Theme | undefined;
let transitionTimer: ReturnType<typeof setTimeout> | undefined;
const ThemeContext = createContext<{
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
} | null>(null);

function snapshot() {
  if (!inMemoryPreference) {
    let saved: unknown = document.documentElement.dataset.themePreference;
    try {
      saved = localStorage.getItem('theme') ?? saved;
    } catch {
      /* Use the document/default when storage is unavailable. */
    }
    inMemoryPreference = isTheme(saved) ? saved : defaultTheme;
  }
  const theme = inMemoryPreference;
  const resolved =
    theme === 'system' ? (window.matchMedia(mediaQuery).matches ? 'dark' : 'light') : theme;
  return `${theme}:${resolved}`;
}

function applyTheme() {
  const [theme, resolved] = snapshot().split(':');
  const root = document.documentElement;
  if (
    !root.classList.contains(resolved!) &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    root.classList.add('theme-transition');
    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => root.classList.remove('theme-transition'), 260);
  }
  root.dataset.themePreference = theme;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved!);
  root.style.colorScheme = resolved!;
}

function subscribe(notify: () => void) {
  const media = window.matchMedia(mediaQuery);
  const update = () => {
    applyTheme();
    notify();
  };
  const storage = (event: StorageEvent) => {
    if (event.key !== 'theme' && event.key !== null) return;
    inMemoryPreference = isTheme(event.newValue) ? event.newValue : defaultTheme;
    update();
  };
  window.addEventListener(themeEvent, update);
  window.addEventListener('storage', storage);
  media.addEventListener('change', update);
  return () => {
    window.removeEventListener(themeEvent, update);
    window.removeEventListener('storage', storage);
    media.removeEventListener('change', update);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const current = useSyncExternalStore(subscribe, snapshot, () => `${defaultTheme}:light`);
  const [theme, resolvedTheme] = current.split(':') as [Theme, 'light' | 'dark'];
  useEffect(() => {
    applyTheme();
  }, [current]);
  const setTheme = useCallback((next: Theme) => {
    if (!isTheme(next)) return;
    inMemoryPreference = next;
    document.documentElement.dataset.themePreference = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* Keep the choice for this document. */
    }
    applyTheme();
    window.dispatchEvent(new Event(themeEvent));
  }, []);
  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
