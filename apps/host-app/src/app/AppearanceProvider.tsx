import { getDirection, isLocale, type I18nInstance, type Locale } from '@repo/i18n';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AppearanceContext,
  type ColorScheme,
  type ThemePreference,
} from '../hooks/appearanceContext';
import type { KeyValueStorage } from '../lib/storage';

export const STORAGE_KEYS = { locale: 'appearance.locale', theme: 'appearance.theme' } as const;

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

export function readInitialLocale(storage: KeyValueStorage, navigatorLanguage: string): Locale {
  return (
    storage.get(STORAGE_KEYS.locale, (raw) => (isLocale(raw) ? raw : null)) ??
    (navigatorLanguage.toLowerCase().startsWith('ar') ? 'ar' : 'en')
  );
}

export function readInitialTheme(storage: KeyValueStorage): ThemePreference {
  return (
    storage.get(STORAGE_KEYS.theme, (raw) => (isThemePreference(raw) ? raw : null)) ?? 'system'
  );
}

function getSystemColorScheme(): ColorScheme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function AppearanceProvider({
  i18n,
  storage,
  children,
}: {
  i18n: I18nInstance;
  storage: KeyValueStorage;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    isLocale(i18n.language) ? i18n.language : 'en',
  );
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() =>
    readInitialTheme(storage),
  );
  const [systemColorScheme, setSystemColorScheme] = useState<ColorScheme>(getSystemColorScheme);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return undefined;

    const onChange = (event: MediaQueryListEvent) => {
      setSystemColorScheme(event.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  const colorScheme = themePreference === 'system' ? systemColorScheme : themePreference;
  const direction = getDirection(locale);

  useLayoutEffect(() => {
    const html = document.documentElement;
    html.lang = locale;
    html.dir = direction;
    html.classList.toggle('dark', colorScheme === 'dark');
    html.style.colorScheme = colorScheme;
  }, [colorScheme, direction, locale]);

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      setLocaleState(nextLocale);
      storage.set(STORAGE_KEYS.locale, nextLocale);
      void i18n.changeLanguage(nextLocale);
    },
    [i18n, storage],
  );

  const setThemePreference = useCallback(
    (nextPreference: ThemePreference) => {
      setThemePreferenceState(nextPreference);
      storage.set(STORAGE_KEYS.theme, nextPreference);
    },
    [storage],
  );

  const value = useMemo(
    () => ({
      locale,
      direction,
      themePreference,
      colorScheme,
      setLocale,
      setThemePreference,
    }),
    [colorScheme, direction, locale, setLocale, setThemePreference, themePreference],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}
