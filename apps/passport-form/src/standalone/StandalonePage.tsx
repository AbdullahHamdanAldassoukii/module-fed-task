import { useCallback, useMemo, useState } from 'react';
import { getDirection, I18nProvider, type Locale } from '@repo/i18n';
import type { PassportDraft, PassportFormState } from '@repo/passport-contract';
import { Button, UiGlobalStyles, UiProvider } from '@repo/ui';
import PassportForm from '../exposes/PassportForm';
import { createAppI18n, M, type AppMessageKey, useT } from '../lib/i18n';
import { StatePanel } from './StatePanel';

const LANGUAGE_NAME = {
  en: M.standalone.languageName.en,
  ar: M.standalone.languageName.ar,
} satisfies Record<Locale, AppMessageKey>;

const THEME_NAME = {
  light: M.standalone.themeName.light,
  dark: M.standalone.themeName.dark,
} satisfies Record<'light' | 'dark', AppMessageKey>;

interface StandaloneContentProps {
  locale: Locale;
  scheme: 'light' | 'dark';
  history: PassportFormState[];
  mountKey: number;
  restore: PassportDraft | undefined;
  onLocaleToggle: () => void;
  onSchemeToggle: () => void;
  onRemount: () => void;
  onChange: (state: PassportFormState) => void;
}

function StandaloneContent({
  locale,
  scheme,
  history,
  mountKey,
  restore,
  onLocaleToggle,
  onSchemeToggle,
  onRemount,
  onChange,
}: StandaloneContentProps) {
  const { t } = useT();
  const direction = getDirection(locale);

  return (
    <UiProvider locale={locale} direction={direction} colorScheme={scheme} scope="standalone">
      <UiGlobalStyles />
      <div
        dir={direction}
        lang={locale}
        className={
          scheme === 'dark'
            ? 'dark min-h-dvh bg-background text-foreground'
            : 'min-h-dvh bg-background text-foreground'
        }
        style={{ maxWidth: 1100, margin: '0 auto', padding: 16, display: 'grid', gap: 16 }}
      >
        <header
          style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>{t(M.standalone.title)}</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={onLocaleToggle}>
              {t(M.standalone.language)}: {t(LANGUAGE_NAME[locale])}
            </Button>
            <Button variant="secondary" size="sm" onClick={onSchemeToggle}>
              {t(M.standalone.theme)}: {t(THEME_NAME[scheme])}
            </Button>
            <Button size="sm" onClick={onRemount}>
              {t(M.standalone.remount)}
            </Button>
          </div>
        </header>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) minmax(280px,420px)',
            gap: 24,
          }}
        >
          <PassportForm
            key={mountKey}
            locale={locale}
            colorScheme={scheme}
            initialValue={restore}
            onChange={onChange}
          />
          <StatePanel history={history} />
        </div>
      </div>
    </UiProvider>
  );
}

export function StandalonePage() {
  const [locale, setLocale] = useState<Locale>('en');
  const [scheme, setScheme] = useState<'light' | 'dark'>('light');
  const [history, setHistory] = useState<PassportFormState[]>([]);
  const [mountKey, setMountKey] = useState(0);
  const [restore, setRestore] = useState<PassportDraft | undefined>(undefined);
  const i18n = useMemo(() => createAppI18n(locale), [locale]);
  const onChange = useCallback((state: PassportFormState) => {
    setHistory((current) => [...current, state]);
  }, []);
  const onLocaleToggle = useCallback(() => {
    setLocale((current) => (current === 'en' ? 'ar' : 'en'));
  }, []);
  const onSchemeToggle = useCallback(() => {
    setScheme((current) => (current === 'light' ? 'dark' : 'light'));
  }, []);
  const onRemount = useCallback(() => {
    setRestore(history.at(-1)?.data);
    setMountKey((current) => current + 1);
  }, [history]);

  return (
    <I18nProvider i18n={i18n}>
      <StandaloneContent
        locale={locale}
        scheme={scheme}
        history={history}
        mountKey={mountKey}
        restore={restore}
        onLocaleToggle={onLocaleToggle}
        onSchemeToggle={onSchemeToggle}
        onRemount={onRemount}
        onChange={onChange}
      />
    </I18nProvider>
  );
}
