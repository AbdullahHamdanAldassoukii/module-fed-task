import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import 'dayjs/locale/en';

interface LocaleWithNumberHooks extends ILocale {
  preparse?: (text: string) => string;
  postformat?: (text: string) => string;
}

const ARABIC_LATIN_DIGITS = 'ar-latn';
const keep = (text: string) => text;
let registered = false;

export function registerDayjsLocales(): void {
  if (registered) return;
  const arabic = dayjs.Ls.ar;
  if (arabic) {
    // Date values must retain Latin digits when the shared plugin is enabled.
    const latin: LocaleWithNumberHooks = {
      ...arabic,
      name: ARABIC_LATIN_DIGITS,
      preparse: keep,
      postformat: keep,
    };
    dayjs.locale(latin, undefined, true);
  }
  registered = true;
}

export function dayjsLocaleFor(locale: string): string {
  return locale === 'ar' ? ARABIC_LATIN_DIGITS : 'en';
}
