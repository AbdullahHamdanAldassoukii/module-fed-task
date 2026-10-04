import { describe, expect, it } from '@rstest/core';
import { UnknownError } from '../errors';
import { noopLogger } from '../logger';
import { createHttpClient } from './core';
import type { Transport } from './types';

const clientWith = (transport: Transport, getLanguage?: () => string) =>
  createHttpClient(transport, {
    baseUrl: 'http://api.test/v1',
    defaultTimeoutMs: 1_000,
    logger: noopLogger,
    getLanguage,
    newRequestId: () => 'req-1',
    sleep: async () => {},
  });

describe('createHttpClient request preparation', () => {
  it.each([1.5, Infinity, -1])(
    'rejects invalid timeoutMs %p before transport',
    async (timeoutMs) => {
      let calls = 0;
      const error = await clientWith(async () => {
        calls += 1;
        throw new Error('transport should not run');
      })
        .send({ method: 'GET', path: '/things', timeoutMs, parse: (data) => data })
        .catch((reason: unknown) => reason);

      expect(error).toBeInstanceOf(UnknownError);
      expect((error as UnknownError).message).toBe('timeoutMs must be a positive finite integer');
      expect(calls).toBe(0);
    },
  );

  it.each([
    [
      'a cyclic body',
      () => {
        const body: { self?: unknown } = {};
        body.self = body;
        return body;
      },
    ],
    ['a BigInt body', () => BigInt(1)],
  ])('does not retry %s serialization failure before transport', async (_name, makeBody) => {
    let calls = 0;
    const error = await clientWith(async () => {
      calls += 1;
      throw new Error('transport should not run');
    })
      .send({
        method: 'POST',
        path: '/things',
        body: makeBody(),
        idempotencyKey: 'safe',
        parse: (data) => data,
      })
      .catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(UnknownError);
    expect(calls).toBe(0);
  });

  it('does not retry a default header failure before transport', async () => {
    let calls = 0;
    const error = await clientWith(
      async () => {
        calls += 1;
        throw new Error('transport should not run');
      },
      () => {
        throw new Error('language unavailable');
      },
    )
      .send({ method: 'GET', path: '/things', parse: (data) => data })
      .catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(UnknownError);
    expect((error as UnknownError).message).toBe('language unavailable');
    expect(calls).toBe(0);
  });
});
