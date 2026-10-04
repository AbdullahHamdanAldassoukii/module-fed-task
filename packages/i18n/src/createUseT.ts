import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getDirection, isLocale, type Direction, type Locale } from './locales';

/** Dot-path keys of a messages object whose values are strings, e.g. `'header.language'`. */
export type TranslationKey<Resources> = {
  [K in keyof Resources & string]: Resources[K] extends string
    ? K
    : Resources[K] extends readonly unknown[]
      ? never
      : Resources[K] extends object
        ? `${K}.${TranslationKey<Resources[K]>}`
        : never;
}[keyof Resources & string];

export type TranslationVars = Record<string, string | number>;

export interface UseTResult<Resources> {
  t: (key: TranslationKey<Resources>, vars?: TranslationVars) => string;
  language: Locale;
  direction: Direction;
}

/**
 * Builds a translation hook typed by an app's messages (`createUseT<typeof en>()`).
 * The hook reads the instance from the nearest `I18nProvider`, so each app decides
 * which instance its components use.
 */
export function createUseT<Resources extends object>() {
  return function useT(): UseTResult<Resources> {
    const { t: translate, i18n } = useTranslation();
    const t = useCallback(
      (key: TranslationKey<Resources>, vars?: TranslationVars) => translate(key, vars),
      [translate],
    );
    // The fallback language serves every unsupported language.
    const language: Locale = isLocale(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'en';
    return { t, language, direction: getDirection(language) };
  };
}
