import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { PASSPORT_FORM_CONTRACT_VERSION } from '@repo/passport-contract';
import { RemoteContractError, RemoteLoadError } from '../../lib/errors';
import { noopLogger } from '../../lib/logger';
import { createPassportFormLoader, defaultReregister } from './loader';

const Comp = () => null;
const good = { default: Comp, contractVersion: PASSPORT_FORM_CONTRACT_VERSION };
const manifestUrl = 'http://localhost:3001/mf-manifest.json';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}

afterEach(() => {
  rs.useRealTimers();
});

describe('createPassportFormLoader', () => {
  it('returns the module once and caches the promise', async () => {
    const importModule = rs.fn(async () => good);
    const loader = createPassportFormLoader({ manifestUrl, logger: noopLogger, importModule });

    await loader.load();
    await loader.load();

    expect(importModule).toHaveBeenCalledTimes(1);
  });

  it('rejects an incompatible or missing contract version with RemoteContractError once', async () => {
    const logger = { ...noopLogger, error: rs.fn() };
    await expect(
      createPassportFormLoader({
        manifestUrl,
        logger,
        importModule: async () => ({ default: Comp, contractVersion: '2.0.0' }),
      }).load(),
    ).rejects.toBeInstanceOf(RemoteContractError);
    await expect(
      createPassportFormLoader({
        manifestUrl,
        logger,
        importModule: async () => ({ default: Comp }),
      }).load(),
    ).rejects.toBeInstanceOf(RemoteContractError);
    await expect(
      createPassportFormLoader({ manifestUrl, logger, importModule: async () => null }).load(),
    ).rejects.toBeInstanceOf(RemoteContractError);
    expect(logger.error).toHaveBeenCalledTimes(3);
  });

  it('maps import failures to RemoteLoadError(load-failed) and does not cache them after reset()', async () => {
    let calls = 0;
    const importModule = rs.fn(async () => {
      calls += 1;
      if (calls === 1) throw new Error('ChunkLoadError');
      return good;
    });
    const reregister = rs.fn();
    const loader = createPassportFormLoader({
      manifestUrl,
      logger: noopLogger,
      importModule,
      reregister,
    });

    const error = await loader.load().catch((value: unknown) => value);
    expect(error).toBeInstanceOf(RemoteLoadError);
    expect((error as RemoteLoadError).reason).toBe('load-failed');

    loader.reset();

    await expect(loader.load()).resolves.toBe(good);
    expect(reregister).toHaveBeenCalledWith(manifestUrl);
  });

  it('keeps a replacement load pending when an older load fails after reset', async () => {
    const first = deferred<unknown>();
    const second = deferred<unknown>();
    let calls = 0;
    const importModule = rs.fn((): Promise<unknown> => {
      calls += 1;
      if (calls === 1) return first.promise;
      if (calls === 2) return second.promise;
      return Promise.resolve(good);
    });
    const loader = createPassportFormLoader({
      manifestUrl,
      logger: noopLogger,
      importModule,
      reregister: rs.fn(),
    });

    const oldLoad = loader.load();
    loader.reset();
    const replacementLoad = loader.load();
    first.reject(new Error('old load failed'));

    await expect(oldLoad).rejects.toBeInstanceOf(RemoteLoadError);

    expect(loader.load()).toBe(replacementLoad);
    expect(importModule).toHaveBeenCalledTimes(2);

    second.resolve(good);
    await expect(replacementLoad).resolves.toBe(good);
  });

  it('force-registers the remote when resetting the default runtime registration', () => {
    const registerRemotes = rs.fn();

    defaultReregister(manifestUrl, registerRemotes);

    expect(registerRemotes).toHaveBeenCalledWith([{ entry: manifestUrl, name: 'passport_form' }], {
      force: true,
    });
  });

  it('rejects a hanging import after fifteen seconds', async () => {
    rs.useFakeTimers();
    const loader = createPassportFormLoader({
      manifestUrl,
      logger: noopLogger,
      importModule: () => new Promise(() => undefined),
    });
    const result = loader.load().catch((value: unknown) => value);

    await rs.advanceTimersByTimeAsync(15_000);

    const error = await result;
    expect(error).toBeInstanceOf(RemoteLoadError);
    expect((error as RemoteLoadError).reason).toBe('timeout');
  });
});
