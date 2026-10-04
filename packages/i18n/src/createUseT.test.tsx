import { describe, expect, it } from '@rstest/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { createI18n } from './createI18n';
import { createMessageKeys } from './createMessageKeys';
import { createDateFormatter, createUseT } from './createUseT';
import { I18nProvider } from './I18nProvider';
import type { Locale } from './locales';
import { dateParam, message, type Message, type TranslationKey } from './message';

const en = {
  greeting: 'Hello {{name}}',
  event: 'Event on {{when}}',
  header: { language: 'Language', steps: { current: 'Step {{current}} of {{total}}' } },
};
const ar = {
  greeting: 'مرحبا {{name}}',
  event: 'حدث في {{when}}',
  header: { language: 'اللغة' },
};
const resources = { en: { translation: en }, ar: { translation: ar } };
const M = createMessageKeys(en);

const useT = createUseT<typeof en>();

function Probe() {
  const { t, language, direction } = useT();
  return (
    <ul lang={language} dir={direction}>
      <li>{t(M.greeting, { name: 'Sara' })}</li>
      <li>{t(M.header.language)}</li>
      <li>{t(M.header.steps.current, { current: 1, total: 2 })}</li>
      <li>{t(message(M.event, { when: dateParam('2026-10-04') }))}</li>
    </ul>
  );
}

function formattedDate(language: Locale) {
  return new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    numberingSystem: 'latn',
    timeZone: 'UTC',
  }).format(new Date('2026-10-04T00:00:00Z'));
}

const ENGLISH = `<ul lang="en" dir="ltr"><li>Hello Sara</li><li>Language</li><li>Step 1 of 2</li><li>Event on ${formattedDate('en')}</li></ul>`;
const ARABIC = `<ul lang="ar" dir="rtl"><li>مرحبا Sara</li><li>اللغة</li><li>Step 1 of 2</li><li>حدث في ${formattedDate('ar')}</li></ul>`;

function renderProbe(lng: Locale) {
  return renderToStaticMarkup(
    <I18nProvider i18n={createI18n({ resources, lng })}>
      <Probe />
    </I18nProvider>,
  );
}

describe('createUseT', () => {
  it('mirrors resources as deeply frozen key constants', () => {
    expect(M.greeting).toBe('greeting');
    expect(M.header.steps.current).toBe('header.steps.current');
    expect(Object.isFrozen(M)).toBe(true);
    expect(Object.isFrozen(M.header)).toBe(true);
  });

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

  it('reformats date parameters when the language changes', async () => {
    const i18n = createI18n({ resources, lng: 'en' });
    expect(
      renderToStaticMarkup(
        <I18nProvider i18n={i18n}>
          <Probe />
        </I18nProvider>,
      ),
    ).toContain(`Event on ${formattedDate('en')}`);

    await i18n.changeLanguage('ar');

    expect(
      renderToStaticMarkup(
        <I18nProvider i18n={i18n}>
          <Probe />
        </I18nProvider>,
      ),
    ).toContain(`حدث في ${formattedDate('ar')}`);
  });

  it('uses Latin digits for Arabic date formatters', () => {
    expect(createDateFormatter('ar').resolvedOptions().numberingSystem).toBe('latn');
    expect(new Intl.DateTimeFormat('ar-EG').resolvedOptions().numberingSystem).toBe('arab');
  });

  it('accepts only keys that hold a string', () => {
    const keys: TranslationKey<typeof en>[] = [M.greeting, M.header.language];
    // @ts-expect-error object key
    keys.push(M.header.steps);
    // @ts-expect-error missing key
    void M.header.missing;

    const t: ReturnType<typeof useT>['t'] = (key) => (typeof key === 'string' ? key : key.key);
    const descriptor: Message<typeof en> = message(M.greeting, { name: 'Sara' });
    // @ts-expect-error plain string
    t('greeting');
    // @ts-expect-error object key
    t(M.header);
    // @ts-expect-error invalid value
    t(M.greeting, { name: true });
    // @ts-expect-error forged descriptor
    t({ key: M.header.language });

    expect(descriptor.key).toBe(M.greeting);
    expect(keys).toHaveLength(3);
  });

  it('rejects arrays in message resource trees', () => {
    // @ts-expect-error nested resource
    expect(() => createMessageKeys({ list: ['a'] })).toThrow(TypeError);
    expect(M.greeting).toBe('greeting');
  });
});
