import { createOnboardingApi, type OnboardingApi } from '../features/onboarding/api';
import type { AppConfig } from '../lib/config';
import { createAxiosHttpClient, type HttpClient } from '../lib/http';
import { createConsoleLogger, type Logger } from '../lib/logger';
import { createWebStorage, type KeyValueStorage } from '../lib/storage';
import { createPassportFormLoader } from '../remotes/passport-form';
import type { PassportFormModule } from '@repo/passport-contract';
import type { RemoteModuleLoader } from '../remotes/types';

export interface Services {
  config: AppConfig;
  logger: Logger;
  http: HttpClient;
  onboardingApi: OnboardingApi;
  localStorage: KeyValueStorage;
  sessionStorage: KeyValueStorage;
  remotes: { passportForm: RemoteModuleLoader<PassportFormModule> };
}

export interface ServiceHooks {
  getExtraHeaders?: () => Record<string, string>;
  getLanguage?: () => string;
}

export function createServices(
  config: AppConfig,
  hooks: ServiceHooks = {},
  overrides: Partial<Services> = {},
): Services {
  const logger = overrides.logger ?? createConsoleLogger(config.logging.level);
  const http =
    overrides.http ??
    createAxiosHttpClient({
      baseUrl: config.api.baseUrl,
      defaultTimeoutMs: config.api.timeoutMs,
      logger,
      getLanguage: hooks.getLanguage,
      defaultHeaders: hooks.getExtraHeaders,
    });

  return {
    config,
    logger,
    http,
    onboardingApi: overrides.onboardingApi ?? createOnboardingApi(http),
    localStorage: overrides.localStorage ?? createWebStorage('local', logger),
    sessionStorage: overrides.sessionStorage ?? createWebStorage('session', logger),
    remotes: overrides.remotes ?? {
      passportForm: createPassportFormLoader({
        manifestUrl: config.remotes.passportForm.manifestUrl,
        logger,
      }),
    },
  };
}
