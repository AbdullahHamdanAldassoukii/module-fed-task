import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { waitFor } from '@testing-library/react';
import { createInstance } from '@module-federation/enhanced/runtime';

const consoleWarnSpies: { mockRestore: () => void }[] = [];

afterEach(() => {
  consoleWarnSpies.splice(0).forEach((spy) => spy.mockRestore());
});

function silenceExpectedConsoleWarn() {
  const spy = rs.spyOn(console, 'warn').mockImplementation(() => undefined);
  consoleWarnSpies.push(spy);
  return spy;
}

describe('Federation runtime load failures', () => {
  it('does not cache a rejected manifest fetch', async () => {
    const consoleWarn = silenceExpectedConsoleWarn();
    const manifestUrl = 'http://127.0.0.1:9/mf-manifest.json';
    const fetch = rs
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new TypeError('manifest unavailable'));
    const instance = createInstance({
      name: 'runtime-rejection-host',
      remotes: [{ name: 'unreachable_remote', entry: manifestUrl }],
    });

    try {
      const error = await instance
        .loadRemote('unreachable_remote/PassportForm')
        .catch((value: unknown) => value);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('[ Federation Runtime ]');
      expect((error as Error).message).toContain('RUNTIME-003');
      expect((error as Error).message).toContain(manifestUrl);
      expect(fetch).toHaveBeenCalledWith(manifestUrl, {});

      await instance.loadRemote('unreachable_remote/PassportForm').catch(() => undefined);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(consoleWarn).toHaveBeenCalledTimes(2);
    } finally {
      fetch.mockRestore();
    }
  });

  it('keeps a hanging manifest fetch until force registration clears it', async () => {
    const consoleWarn = silenceExpectedConsoleWarn();
    const manifestUrl = 'http://127.0.0.1:9/mf-manifest.json';
    const fetch = rs
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => new Promise<Response>(() => undefined));
    const instance = createInstance({
      name: 'runtime-hang-host',
      remotes: [{ name: 'hanging_remote', entry: manifestUrl }],
    });

    try {
      void instance.loadRemote('hanging_remote/PassportForm').catch(() => undefined);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

      void instance.loadRemote('hanging_remote/PassportForm').catch(() => undefined);
      await Promise.resolve();
      expect(fetch).toHaveBeenCalledTimes(1);

      instance.registerRemotes([{ name: 'hanging_remote', entry: manifestUrl }], {
        force: true,
      });
      void instance.loadRemote('hanging_remote/PassportForm').catch(() => undefined);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
      expect(consoleWarn).toHaveBeenCalledTimes(1);
    } finally {
      fetch.mockRestore();
    }
  });
});
