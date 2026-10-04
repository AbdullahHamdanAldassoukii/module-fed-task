import { describe, expect, it } from '@rstest/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { createI18n } from './createI18n';
import { createUseT, type TranslationKey } from './createUseT';
import { I18nProvider } from './I18nProvider';
import type { Locale } from './locales';

const en = {
  greeting: 'Hello {{name}}',
  header: { language: 'Language', steps: { current: 'Step {{current}} of {{total}}' } },
};
const ar = { greeting: 'مرحبا {{name}}', header: { language: 'اللغة' } };
const resources = { en: { translation: en }, ar: { translation: ar } };

const useT = createUseT<typeof en>();

function Probe() {
  const { t, language, direction } = useT();
  return (
    <ul lang={language} dir={direction}>
      <li>{t('greeting', { name: 'Sara' })}</li>
      <li>{t('header.language')}</li>
      <li>{t('header.steps.current', { current: 1, total: 2 })}</li>
    </ul>
  );
}

const ENGLISH =
  '<ul lang="en" dir="ltr"><li>Hello Sara</li><li>Language</li><li>Step 1 of 2</li></ul>';
const ARABIC = '<ul lang="ar" dir="rtl"><li>مرحبا Sara</li><li>اللغة</li><li>Step 1 of 2</li></ul>';

function renderProbe(lng: Locale) {
  return renderToStaticMarkup(
    <I18nProvider i18n={createI18n({ resources, lng })}>
      <Probe />
    </I18nProvider>,
  );
}

describe('createUseT', () => {
  it('translates and interpolates through the provider', () => {
    expect(renderProbe('en')).toBe(ENGLISH);
  });

  it('reports the language and direction, falling back to English for missing keys', () => {
    expect(renderProbe('ar')).toBe(ARABIC);
  });

  it('uses the nearest provider, so a nested instance never reads the outer one', () => {
    const outer = createI18n({ resources, lng: 'en' });
    const inner = createI18n({ resources, lng: 'ar' });
    const html = renderToStaticMarkup(
      <I18nProvider i18n={outer}>
        <Probe />
        <I18nProvider i18n={inner}>
          <Probe />
        </I18nProvider>
      </I18nProvider>,
    );
    expect(html).toBe(ENGLISH + ARABIC);
  });

  it('reports English when the instance is switched to an unsupported language', async () => {
    const i18n = createI18n({ resources, lng: 'ar' });
    await i18n.changeLanguage('fr');
    const html = renderToStaticMarkup(
      <I18nProvider i18n={i18n}>
        <Probe />
      </I18nProvider>,
    );
    expect(html).toBe(ENGLISH);
  });

  // These lines are checked by the type checker: each directive fails it if the line compiles.
  it('accepts only keys that hold a string', () => {
    const keys: TranslationKey<typeof en>[] = ['greeting', 'header.language'];
    // @ts-expect-error not a key of the messages
    keys.push('header.missing');
    // @ts-expect-error holds an object, not a string
    keys.push('header.steps');

    const t: ReturnType<typeof useT>['t'] = (key) => key;
    // @ts-expect-error not a key of the messages
    t('missing');
    // @ts-expect-error holds an object, not a string
    t('header');
    // @ts-expect-error interpolation values are strings or numbers
    t('greeting', { name: null });

    expect(keys).toHaveLength(4);
  });
});
