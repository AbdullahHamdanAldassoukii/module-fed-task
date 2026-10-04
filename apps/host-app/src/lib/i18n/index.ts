import {
  createI18n,
  createMessageKeys,
  createUseT,
  type Locale,
  type TranslationKey,
} from '@repo/i18n';
import ar from '../../locales/ar.json';
import en from '../../locales/en.json';

export const resources = { en: { translation: en }, ar: { translation: ar } } as const;
export const M = createMessageKeys(en);
export type AppMessageKey = TranslationKey<typeof en>;

export const useT = createUseT<typeof en>();

export function createAppI18n(locale: Locale) {
  return createI18n({ resources, lng: locale });
}
