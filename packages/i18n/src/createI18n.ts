import i18next, { type Resource, type i18n } from 'i18next';
import { SUPPORTED_LOCALES, type Locale } from './locales';

export interface CreateI18nOptions {
  resources: Resource;
  lng: Locale;
}

/**
 * A fresh, isolated i18next instance. Never the global one: the host and the
 * remote each own theirs, so one can never change the other's language.
 */
export function createI18n({ resources, lng }: CreateI18nOptions): i18n {
  const instance = i18next.createInstance();
  void instance.init({
    resources,
    lng,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LOCALES,
    initAsync: false, // synchronous init: resources are inline
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance;
}
