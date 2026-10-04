// @rstest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@rstest/core';
import { HttpResponse, delay, http } from 'msw';
import { setupServer } from 'msw/node';
import {
  CancelledError,
  HttpError,
  NetworkError,
  ResponseContractError,
  TimeoutError,
  ValidationError,
} from '../errors';
import { noopLogger } from '../logger';
import { createAxiosTransport } from './axiosTransport';
import { createFetchTransport } from './fetchTransport';
import { createHttpClient } from './core';
import type { Transport } from './types';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const BASE = 'http://api.test/v1';
const transports: [string, () => Transport][] = [
  ['axios', createAxiosTransport],
  ['fetch', createFetchTransport],
];

for (const [name, makeTransport] of transports) {
  describe(`HttpClient contract (${name})`, () => {
    const client = (overrides: Partial<Parameters<typeof createHttpClient>[1]> = {}) =>
      createHttpClient(makeTransport(), {
        baseUrl: BASE,
        defaultTimeoutMs: 2_000,
        logger: noopLogger,
        getLanguage: () => 'ar',
        newRequestId: () => 'req-1',
        sleep: async () => {},
        random: () => 0,
        ...overrides,
      });

    it('GET builds the URL with query, sends standard headers and parses JSON', async () => {
      let seen: Request | undefined;
      server.use(
        http.get(`${BASE}/things`, ({ request }) => {
          seen = request;
          return HttpResponse.json({ items: [1, 2] });
        }),
      );

      const out = await client().send({
        method: 'GET',
        path: '/things',
        query: { page: '2', q: 'a b' },
        parse: (data) => data as { items: number[] },
      });

      expect(out.items).toEqual([1, 2]);
      const url = new URL(seen!.url);
      expect(url.searchParams.get('page')).toBe('2');
      expect(url.searchParams.get('q')).toBe('a b');
      expect(seen!.headers.get('accept-language')).toBe('ar');
      expect(seen!.headers.get('x-request-id')).toBe('req-1');
      expect(seen!.headers.get('accept')).toContain('application/json');
    });

    it('POST sends a JSON body and the idempotency key', async () => {
      let seen: { body: unknown; key: string | null } | undefined;
      server.use(
        http.post(`${BASE}/things`, async ({ request }) => {
          seen = {
            body: await request.json(),
            key: request.headers.get('idempotency-key'),
          };
          return HttpResponse.json({ id: 'x' }, { status: 201 });
        }),
      );

      await client().send({
        method: 'POST',
        path: '/things',
        body: { a: 1 },
        idempotencyKey: 'k-1',
        parse: (data) => data as { id: string },
      });

      expect(seen).toEqual({ body: { a: 1 }, key: 'k-1' });
    });

    it('maps non-2xx to HttpError with status and body, 422 to ValidationError', async () => {
      server.use(
        http.get(`${BASE}/missing`, () =>
          HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 }),
        ),
      );
      const error = await client()
        .send({ method: 'GET', path: '/missing', parse: (data) => data })
        .catch((value: unknown) => value);
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(404);
      expect((error as HttpError).body).toEqual({ code: 'NOT_FOUND' });
      expect((error as HttpError).requestId).toBe('req-1');

      server.use(
        http.post(`${BASE}/apps`, () =>
          HttpResponse.json(
            { code: 'VALIDATION', fieldErrors: { 'idInfo.idNumber': 'INVALID' } },
            { status: 422 },
          ),
        ),
      );
      const validationError = await client()
        .send({ method: 'POST', path: '/apps', body: {}, parse: (data) => data })
        .catch((value: unknown) => value);
      expect(validationError).toBeInstanceOf(ValidationError);
      expect((validationError as ValidationError).fieldErrors['idInfo.idNumber']).toBe('INVALID');
    });

    it('keeps a malformed JSON error response as raw text without retrying', async () => {
      let calls = 0;
      server.use(
        http.get(`${BASE}/malformed-error`, () => {
          calls += 1;
          return new HttpResponse('not json', {
            status: 400,
            headers: { 'content-type': 'application/json' },
          });
        }),
      );

      const error = await client()
        .send({ method: 'GET', path: '/malformed-error', parse: (data) => data })
        .catch((value: unknown) => value);

      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(400);
      expect((error as HttpError).body).toBe('not json');
      expect(calls).toBe(1);
    });

    it('a parse failure becomes ResponseContractError', async () => {
      server.use(http.get(`${BASE}/weird`, () => HttpResponse.json({ nope: true })));
      const error = await client()
        .send({
          method: 'GET',
          path: '/weird',
          parse: () => {
            throw new Error('expected items');
          },
        })
        .catch((value: unknown) => value);
      expect(error).toBeInstanceOf(ResponseContractError);
    });

    it('passes malformed JSON success responses to parse as raw text without retrying', async () => {
      let calls = 0;
      let received: unknown;
      server.use(
        http.get(`${BASE}/malformed-success`, () => {
          calls += 1;
          return new HttpResponse('not json', {
            headers: { 'content-type': 'application/json' },
          });
        }),
      );

      const error = await client()
        .send({
          method: 'GET',
          path: '/malformed-success',
          parse: (data) => {
            received = data;
            if (typeof data !== 'string') throw new Error('expected raw response text');
            throw new Error('invalid response body');
          },
        })
        .catch((value: unknown) => value);

      expect(received).toBe('not json');
      expect(error).toBeInstanceOf(ResponseContractError);
      expect(calls).toBe(1);
    });

    it('passes null to parse for an empty response', async () => {
      server.use(http.get(`${BASE}/empty`, () => new HttpResponse(null, { status: 204 })));
      let parsed: unknown = 'not-called';

      await client().send({
        method: 'GET',
        path: '/empty',
        parse: (data) => {
          parsed = data;
          return data;
        },
      });

      expect(parsed).toBeNull();
    });

    it('passes text/plain response bodies to parse as strings', async () => {
      server.use(
        http.get(
          `${BASE}/text`,
          () => new HttpResponse('123', { headers: { 'content-type': 'text/plain' } }),
        ),
      );
      let parsed: unknown = null;

      await client().send({
        method: 'GET',
        path: '/text',
        parse: (data) => {
          parsed = data;
          return data;
        },
      });

      expect(parsed).toBe('123');
    });

    it('retries GET on network failure up to 3 attempts, then NetworkError', async () => {
      let calls = 0;
      server.use(
        http.get(`${BASE}/flaky`, () => {
          calls += 1;
          return HttpResponse.error();
        }),
      );
      const error = await client()
        .send({ method: 'GET', path: '/flaky', parse: (data) => data })
        .catch((value: unknown) => value);
      expect(error).toBeInstanceOf(NetworkError);
      expect(calls).toBe(3);
    });

    it('does not retry a POST without an idempotency key', async () => {
      let calls = 0;
      server.use(
        http.post(`${BASE}/once`, () => {
          calls += 1;
          return HttpResponse.json({}, { status: 503, headers: { 'retry-after': '0' } });
        }),
      );
      await client()
        .send({ method: 'POST', path: '/once', body: {}, parse: (data) => data })
        .catch(() => undefined);
      expect(calls).toBe(1);
    });

    it('honors Retry-After before retrying an idempotent POST', async () => {
      let calls = 0;
      const delays: number[] = [];
      server.use(
        http.post(`${BASE}/twice`, () => {
          calls += 1;
          return calls < 2
            ? HttpResponse.json({}, { status: 503, headers: { 'retry-after': '2' } })
            : HttpResponse.json({ ok: true }, { status: 201 });
        }),
      );
      const out = await client({
        sleep: async (ms) => {
          delays.push(ms);
        },
      }).send({
        method: 'POST',
        path: '/twice',
        body: {},
        idempotencyKey: 'k',
        parse: (data) => data as { ok: boolean },
      });
      expect(out.ok).toBe(true);
      expect(calls).toBe(2);
      expect(delays).toEqual([2_000]);
    });

    it('clamps Retry-After to the retry policy maximum', async () => {
      let calls = 0;
      const delays: number[] = [];
      server.use(
        http.get(`${BASE}/capped`, () => {
          calls += 1;
          return calls < 2
            ? HttpResponse.json(
                {},
                { status: 503, headers: { 'retry-after': '999999999999999999999' } },
              )
            : HttpResponse.json({ ok: true });
        }),
      );

      await client({
        sleep: async (ms) => {
          delays.push(ms);
        },
      }).send({
        method: 'GET',
        path: '/capped',
        retry: { maxAttempts: 2, baseDelayMs: 10, maxDelayMs: 750 },
        parse: (data) => data,
      });

      expect(calls).toBe(2);
      expect(delays).toEqual([750]);
    });

    it('times out with TimeoutError', async () => {
      server.use(
        http.get(`${BASE}/slow`, async () => {
          await delay(500);
          return HttpResponse.json({});
        }),
      );
      const error = await client()
        .send({
          method: 'GET',
          path: '/slow',
          timeoutMs: 50,
          retry: false,
          parse: (data) => data,
        })
        .catch((value: unknown) => value);
      expect(error).toBeInstanceOf(TimeoutError);
    });

    it('caller abort becomes CancelledError and does not retry', async () => {
      let calls = 0;
      server.use(
        http.get(`${BASE}/abort`, async () => {
          calls += 1;
          await delay(200);
          return HttpResponse.json({});
        }),
      );
      const controller = new AbortController();
      const pending = client().send({
        method: 'GET',
        path: '/abort',
        signal: controller.signal,
        parse: (data) => data,
      });
      setTimeout(() => controller.abort(), 20);
      const error = await pending.catch((value: unknown) => value);
      expect(error).toBeInstanceOf(CancelledError);
      expect(calls).toBe(1);
    });

    it('caller abort during retry backoff becomes CancelledError without another transport call', async () => {
      let calls = 0;
      let enterBackoff: (() => void) | undefined;
      const backoffStarted = new Promise<void>((resolve) => {
        enterBackoff = resolve;
      });
      server.use(
        http.get(`${BASE}/abort-backoff`, () => {
          calls += 1;
          return HttpResponse.json({}, { status: 503 });
        }),
      );
      const controller = new AbortController();
      const pending = client({
        sleep: async (_ms, signal) =>
          new Promise<void>((resolve) => {
            enterBackoff?.();
            signal.addEventListener('abort', () => resolve(), { once: true });
          }),
      }).send({
        method: 'GET',
        path: '/abort-backoff',
        signal: controller.signal,
        parse: (data) => data,
      });

      await backoffStarted;
      controller.abort();
      const error = await pending.catch((value: unknown) => value);
      expect(error).toBeInstanceOf(CancelledError);
      expect(calls).toBe(1);
    });

    it('merges defaultHeaders and per-request headers with per-request precedence', async () => {
      let seen: Request | undefined;
      server.use(
        http.get(`${BASE}/h`, ({ request }) => {
          seen = request;
          return HttpResponse.json({});
        }),
      );
      await client({ defaultHeaders: () => ({ 'x-mock-scenario': 'slow', 'X-A': '1' }) }).send({
        method: 'GET',
        path: '/h',
        headers: { 'x-a': '2' },
        parse: (data) => data,
      });
      expect(seen!.headers.get('x-mock-scenario')).toBe('slow');
      expect(seen!.headers.get('x-a')).toBe('2');
    });

    it('keeps its own request id and idempotency key over caller headers in any case', async () => {
      let seen: Request | undefined;
      server.use(
        http.post(`${BASE}/ids`, ({ request }) => {
          seen = request;
          return HttpResponse.json({});
        }),
      );
      await client({
        defaultHeaders: () => ({ 'X-Request-Id': 'from-defaults', 'Idempotency-Key': 'stale' }),
      }).send({
        method: 'POST',
        path: '/ids',
        body: {},
        idempotencyKey: 'k-own',
        headers: { 'x-REQUEST-id': 'from-request', 'IDEMPOTENCY-KEY': 'other' },
        parse: (data) => data,
      });
      expect(seen!.headers.get('x-request-id')).toBe('req-1');
      expect(seen!.headers.get('idempotency-key')).toBe('k-own');
    });
  });
}
