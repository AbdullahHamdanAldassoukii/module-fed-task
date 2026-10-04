import { describe, expect, it } from '@rstest/core';
import { ZodError } from 'zod';
import { ConfigError } from '../errors';
import { loadConfig } from './loadConfig';

const valid = {
  env: 'qa',
  api: { baseUrl: 'http://localhost:3002/api', timeoutMs: 5000 },
  remotes: { passportForm: { manifestUrl: 'http://localhost:3001/mf-manifest.json' } },
  logging: { level: 'info' },
  features: { devPanel: true, browserMocks: false },
};

describe('loadConfig', () => {
  it('returns the parsed config', async () => {
    const config = await loadConfig(async () => valid);
    expect(config.env).toBe('qa');
  });

  it('wraps fetch failures in ConfigError', async () => {
    await expect(
      loadConfig(async () => {
        throw new Error('404');
      }),
    ).rejects.toBeInstanceOf(ConfigError);
  });

  it('wraps invalid payloads in ConfigError with the issues', async () => {
    const error = await loadConfig(async () => ({ env: 'qa' })).catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(ConfigError);
    expect((error as ConfigError).message).toMatch(/api/);
    expect((error as ConfigError).cause).toBeInstanceOf(ZodError);
  });
});
