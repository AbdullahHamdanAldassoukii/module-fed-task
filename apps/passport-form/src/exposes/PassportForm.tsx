import '@remote-styles';
import { useEffect } from 'react';
import { getDirection, I18nProvider, isLocale } from '@repo/i18n';
import { PASSPORT_FORM_CONTRACT_VERSION, type PassportFormProps } from '@repo/passport-contract';
import { UiProvider } from '@repo/ui';
import { PassportFormShell } from '../features/passport/components/PassportFormShell';
import { createAppI18n } from '../lib/i18n';

const i18n = createAppI18n('en');

export const contractVersion = PASSPORT_FORM_CONTRACT_VERSION;

export default function PassportForm({
  initialValue,
  onChange,
  locale,
  colorScheme,
}: PassportFormProps) {
  const safeLocale = isLocale(locale) ? locale : 'en';
  const safeScheme = colorScheme === 'dark' ? 'dark' : 'light';
  const direction = getDirection(safeLocale);

  useEffect(() => {
    if (i18n.language !== safeLocale) void i18n.changeLanguage(safeLocale);
  }, [safeLocale]);

  return (
    <div
      data-passport-form-root=""
      dir={direction}
      lang={safeLocale}
      className={safeScheme === 'dark' ? 'dark' : undefined}
    >
      <I18nProvider i18n={i18n}>
        <UiProvider locale={safeLocale} direction={direction} colorScheme={safeScheme} scope="pf">
          <PassportFormShell initialValue={initialValue} onChange={onChange} />
        </UiProvider>
      </I18nProvider>
    </div>
  );
}
