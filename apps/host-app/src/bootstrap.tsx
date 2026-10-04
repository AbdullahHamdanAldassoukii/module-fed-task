import '@app-styles';
import { registerRemotes, preloadRemote } from '@module-federation/enhanced/runtime';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { AppProviders, createQueryClient } from './app/AppProviders';
import { readInitialLocale } from './app/AppearanceProvider';
import { renderConfigErrorPage } from './app/configErrorPage';
import { createServices } from './app/createServices';
import { DevPanel } from './app/devPanel/DevPanel';
import { getExtraRequestHeaders } from './app/devScenarios';
import {
  installPassportFormScenarioPlugin,
  isScenarioCompatibleContractVersion,
} from './app/remoteScenarios';
import { loadConfig } from './lib/config';
import { createAppI18n } from './lib/i18n';
import { createConsoleLogger } from './lib/logger';
import { createWebStorage } from './lib/storage';
import { createPassportFormLoader } from './remotes/passport-form';

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${url} → HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
}

export async function bootstrap() {
  const container = document.getElementById('root');
  if (!container) throw new Error('#root is missing from index.html');

  let config;
  try {
    config = await loadConfig(fetchJson);
  } catch (error) {
    renderConfigErrorPage(container, error);
    return;
  }

  if (config.remotes.passportForm.manifestUrl !== import.meta.env.REMOTE_MANIFEST_URL) {
    registerRemotes([{ name: 'passport_form', entry: config.remotes.passportForm.manifestUrl }], {
      force: true,
    });
  }
  if (import.meta.env.DEV || config.features.devPanel) {
    installPassportFormScenarioPlugin(config.remotes.passportForm.manifestUrl);
  }
  void preloadRemote([{ nameOrAlias: 'passport_form', exposes: ['./PassportForm'] }]).catch(
    () => undefined,
  );

  if (import.meta.env.DEV && config.features.browserMocks) {
    const { worker } = await import('@repo/api-mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
  }

  const bootstrapLogger = createConsoleLogger(config.logging.level);
  const localStorage = createWebStorage('local', bootstrapLogger);
  const locale = readInitialLocale(localStorage, navigator.language);
  const i18n = createAppI18n(locale);
  const services = createServices(
    config,
    { getLanguage: () => i18n.language, getExtraHeaders: getExtraRequestHeaders },
    {
      logger: bootstrapLogger,
      localStorage,
      remotes: {
        passportForm: createPassportFormLoader({
          manifestUrl: config.remotes.passportForm.manifestUrl,
          logger: bootstrapLogger,
          ...(import.meta.env.DEV || config.features.devPanel
            ? { isCompatibleVersion: isScenarioCompatibleContractVersion }
            : {}),
        }),
      },
    },
  );
  const queryClient = createQueryClient(services);

  createRoot(container).render(
    <StrictMode>
      <AppProviders services={services} i18n={i18n} queryClient={queryClient}>
        <App />
        {config.features.devPanel ? <DevPanel /> : null}
      </AppProviders>
    </StrictMode>,
  );
}

void bootstrap();
