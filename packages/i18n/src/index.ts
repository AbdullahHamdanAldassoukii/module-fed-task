export * from './locales';
export { createI18n, type CreateI18nOptions } from './createI18n';
export {
  createUseT,
  type TranslationKey,
  type TranslationVars,
  type UseTResult,
} from './createUseT';
export { I18nProvider } from './I18nProvider';
export { useTranslation, Trans } from 'react-i18next';
export type { i18n as I18nInstance } from 'i18next';
