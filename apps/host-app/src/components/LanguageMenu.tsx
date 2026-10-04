import { SUPPORTED_LOCALES, type Locale } from '@repo/i18n';
import { DropdownMenu } from '@repo/ui';
import { useAppearance } from '../hooks/useAppearance';
import { M, useT } from '../lib/i18n';

const names: Record<Locale, string> = { en: 'English', ar: 'العربية' };

export function LanguageMenu() {
  const { t } = useT();
  const { locale, setLocale } = useAppearance();
  const currentName = names[locale];

  return (
    <DropdownMenu
      ariaLabel={`${t(M.header.language)}: ${currentName}`}
      triggerLabel={currentName}
      items={SUPPORTED_LOCALES.map((supportedLocale) => ({
        id: supportedLocale,
        label: names[supportedLocale],
        selected: supportedLocale === locale,
        onSelect: () => setLocale(supportedLocale),
      }))}
    />
  );
}
