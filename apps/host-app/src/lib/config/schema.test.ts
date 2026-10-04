import { describe, expect, it } from '@rstest/core';
import { appConfigSchema } from './schema';

const valid = {
  env: 'development',
  api: { baseUrl: '/api', timeoutMs: 10_000 },
  remotes: { passportForm: { manifestUrl: 'http://localhost:3001/mf-manifest.json' } },
  logging: { level: 'debug' },
  features: { devPanel: true, browserMocks: true },
};

describe('appConfigSchema', () => {
  it('accepts a valid config', () => {
    expect(appConfigSchema.safeParse(valid).success).toBe(true);
  });

  it('defaults timeoutMs', () => {
    const result = appConfigSchema.safeParse({ ...valid, api: { baseUrl: '/api' } });
    expect(result.success && result.data.api.timeoutMs).toBe(10_000);
  });

  it('rejects browser mocks in production', () => {
    const result = appConfigSchema.safeParse({
      ...valid,
      env: 'production',
      features: { devPanel: false, browserMocks: true },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-URL manifest and unknown environment', () => {
    expect(
      appConfigSchema.safeParse({
        ...valid,
        remotes: { passportForm: { manifestUrl: 'nope' } },
      }).success,
    ).toBe(false);
    expect(appConfigSchema.safeParse({ ...valid, env: 'staging' }).success).toBe(false);
  });
});
