import type { Services } from '../app/createServices';
import type { AppConfig } from '../lib/config';
import type { HttpClient } from '../lib/http';
import { noopLogger } from '../lib/logger';
import { createMemoryStorage } from '../lib/storage';
import { createPassportFormLoader } from '../remotes/passport-form';
import { fakeModule } from './fakeRemotes';

export const fakeConfig: AppConfig = {
  env: 'development',
  api: { baseUrl: '/api', timeoutMs: 1000 },
  remotes: { passportForm: { manifestUrl: 'http://localhost:3001/mf-manifest.json' } },
  logging: { level: 'error' },
  features: { devPanel: true, browserMocks: false },
};

export const neverHttp: HttpClient = {
  send: () => Promise.reject(new Error('HTTP is not expected in this test')),
};

export function fakeServices(overrides: Partial<Services> = {}): Services {
  return {
    config: fakeConfig,
    logger: noopLogger,
    http: neverHttp,
    onboardingApi: {
      submitApplication: () => Promise.reject(new Error('Onboarding is not expected in this test')),
    },
    localStorage: createMemoryStorage(),
    sessionStorage: createMemoryStorage(),
    remotes: {
      passportForm: createPassportFormLoader({
        manifestUrl: fakeConfig.remotes.passportForm.manifestUrl,
        logger: noopLogger,
        importModule: async () => fakeModule(),
        reregister: () => undefined,
      }),
    },
    ...overrides,
  };
}
