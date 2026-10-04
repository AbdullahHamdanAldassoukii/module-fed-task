import '@remote-styles';
import { getDirection, I18nProvider, isLocale, type I18nInstance, type Locale } from '@repo/i18n';
import { PASSPORT_FORM_CONTRACT_VERSION, type PassportFormProps } from '@repo/passport-contract';
import { UiProvider } from '@repo/ui';
import { PassportFormFields } from '../features/passport/components/PassportFormFields';
import { createAppI18n } from '../lib/i18n';

const i18nByLocale = {
  en: createAppI18n('en'),
  ar: createAppI18n('ar'),
} satisfies Record<Locale, I18nInstance>;

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

  return (
    <div
      data-passport-form-root=""
      dir={direction}
      lang={safeLocale}
      className={safeScheme === 'dark' ? 'dark' : undefined}
    >
      <I18nProvider i18n={i18nByLocale[safeLocale]}>
        <UiProvider locale={safeLocale} direction={direction} colorScheme={safeScheme} scope="pf">
          <PassportFormFields initialValue={initialValue} onChange={onChange} />
        </UiProvider>
      </I18nProvider>
    </div>
  );
}
