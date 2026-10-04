import i18next, { type Resource, type i18n } from 'i18next';
import { SUPPORTED_LOCALES, type Locale } from './locales';

export interface CreateI18nOptions {
  resources: Resource;
  lng: Locale;
}

export function createI18n({ resources, lng }: CreateI18nOptions): i18n {
  // Host and remote languages must not share a global instance.
  const instance = i18next.createInstance();
  void instance.init({
    resources,
    lng,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LOCALES,
    initAsync: false,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance;
}
