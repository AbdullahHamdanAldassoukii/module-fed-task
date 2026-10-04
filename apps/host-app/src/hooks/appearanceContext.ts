import type { Direction, Locale } from '@repo/i18n';
import { createContext } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

export interface Appearance {
  locale: Locale;
  direction: Direction;
  themePreference: ThemePreference;
  colorScheme: ColorScheme;
  setLocale: (locale: Locale) => void;
  setThemePreference: (preference: ThemePreference) => void;
}

export const AppearanceContext = createContext<Appearance | null>(null);
