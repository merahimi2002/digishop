'use client';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
const palettes = ['original', 'violet', 'ocean', 'rose'] as const;
type PaletteName = (typeof palettes)[number];
const colors = { original: '#0f766e', violet: '#6d28d9', ocean: '#0369a1', rose: '#be185d' };
const eventName = 'digishop:palette-change';
function snapshot(): PaletteName {
  const value = document.documentElement.dataset.palette;
  return palettes.find((name) => name === value) ?? 'original';
}
function apply(value: string | null) {
  document.documentElement.dataset.palette = palettes.find((name) => name === value) ?? 'original';
  window.dispatchEvent(new Event(eventName));
}
function subscribe(notify: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === 'palette' || event.key === null) apply(event.newValue);
  };
  window.addEventListener(eventName, notify);
  window.addEventListener('storage', storage);
  return () => {
    window.removeEventListener(eventName, notify);
    window.removeEventListener('storage', storage);
  };
}
export function PalettePicker() {
  const t = useTranslations('Common');
  const current = useSyncExternalStore(subscribe, snapshot, () => 'original' as const);
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menu.current?.contains(event.target) && menu.current)
        menu.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, []);
  return (
    <details className="palette-picker" ref={menu}>
      <summary aria-label={t('palette')} title={t('palette')}>
        <Palette size={18} aria-hidden="true" />
      </summary>
      <fieldset className="palette-options">
        <legend className="sr-only">{t('palette')}</legend>
        {palettes.map((name) => (
          <button
            type="button"
            key={name}
            aria-pressed={current === name}
            onClick={() => {
              try {
                localStorage.setItem('palette', name);
              } catch {
                /* Keep selection for this document. */
              }
              apply(name);
              if (menu.current) menu.current.open = false;
            }}
          >
            <span
              className="palette-swatch"
              style={{ background: colors[name] }}
              aria-hidden="true"
            />
            <span>{t(name)}</span>
            {current === name && <Check size={14} aria-hidden="true" />}
          </button>
        ))}
      </fieldset>
    </details>
  );
}
