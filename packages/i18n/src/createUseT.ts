import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getDirection, isLocale, type Direction, type Locale } from './locales';
import {
  isDateParam,
  isMessage,
  type Message,
  type TranslationKey,
  type TranslationVars,
} from './message';

export interface Translate<Resources extends object> {
  (key: TranslationKey<Resources>, params?: TranslationVars): string;
  (descriptor: Message<Resources>): string;
}

const dateFormatters = new Map<Locale, Intl.DateTimeFormat>();

export function createDateFormatter(language: Locale): Intl.DateTimeFormat {
  const existing = dateFormatters.get(language);
  if (existing) return existing;

  const formatter = new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    numberingSystem: 'latn',
    timeZone: 'UTC',
  });
  dateFormatters.set(language, formatter);
  return formatter;
}

function formatParams(
  params: TranslationVars | undefined,
  language: Locale,
): TranslationVars | undefined {
  if (params === undefined) return undefined;

  let formatted: TranslationVars | undefined;
  for (const [name, value] of Object.entries(params)) {
    if (!isDateParam(value)) continue;
    formatted ??= { ...params };
    formatted[name] = createDateFormatter(language).format(new Date(`${value.iso}T00:00:00Z`));
  }
  return formatted ?? params;
}

export interface UseTResult<Resources extends object> {
  t: Translate<Resources>;
  language: Locale;
  direction: Direction;
}

export function createUseT<Resources extends object>() {
  return function useT(): UseTResult<Resources> {
    const { t: translate, i18n } = useTranslation();
    const language: Locale = isLocale(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'en';
    const t = useCallback(
      ((
        keyOrDescriptor: TranslationKey<Resources> | Message<Resources>,
        vars: TranslationVars | undefined,
      ) => {
        if (isMessage<Resources>(keyOrDescriptor)) {
          return translate(keyOrDescriptor.key, formatParams(keyOrDescriptor.params, language));
        }
        return translate(keyOrDescriptor, formatParams(vars, language));
      }) as Translate<Resources>,
      [language, translate],
    );
    return { t, language, direction: getDirection(language) };
  };
}
