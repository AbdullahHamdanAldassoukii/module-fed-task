export const SUPPORTED_LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type Direction = 'ltr' | 'rtl';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function getDirection(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
