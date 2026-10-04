import {
  CancelledError,
  HttpError,
  isAppError,
  NetworkError,
  ResponseContractError,
  TimeoutError,
  ValidationError,
  toAppError,
  type AppError,
} from '../errors';
import { backoffDelay, parseRetryAfter, shouldRetry } from './retry';
import {
  DEFAULT_RETRY_POLICY,
  type HttpClient,
  type HttpClientOptions,
  type HttpRequest,
  type Transport,
  type TransportResponse,
} from './types';

const defaultSleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });

const defaultRequestId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function buildUrl(baseUrl: string, path: string, query?: Record<string, string>): string {
  const url = new URL(
    `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
    typeof window === 'undefined' ? 'http://localhost' : window.location.origin,
  );

  for (const [key, value] of Object.entries(query ?? {})) {
    url.searchParams.set(key, value);
  }

  return baseUrl.startsWith('/') ? `${url.pathname}${url.search}` : url.toString();
}

function validateTimeout(timeoutMs: number): void {
  if (!Number.isFinite(timeoutMs) || !Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError('timeoutMs must be a positive finite integer');
  }
}

function mergeHeaders(...sources: (Record<string, string> | undefined)[]): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const source of sources) {
    for (const [name, value] of Object.entries(source ?? {})) {
      headers[name.toLowerCase()] = value;
    }
  }
  return headers;
}

function isValidationBody(body: unknown): body is { fieldErrors: Record<string, string> } {
  if (typeof body !== 'object' || body === null || !('fieldErrors' in body)) return false;

  const fieldErrors = body.fieldErrors;
  return (
    typeof fieldErrors === 'object' &&
    fieldErrors !== null &&
    !Array.isArray(fieldErrors) &&
    Object.values(fieldErrors).every((value) => typeof value === 'string')
  );
}

function toHttpError(response: TransportResponse, requestId: string): AppError {
  if (response.status === 422 && isValidationBody(response.body)) {
    return new ValidationError(response.body.fieldErrors, { requestId });
  }

  return new HttpError(response.status, response.body, {
    requestId,
    retryAfter: response.headers.get('retry-after'),
  });
}

export function createHttpClient(transport: Transport, options: HttpClientOptions): HttpClient {
  const sleep = options.sleep ?? defaultSleep;
  const random = options.random ?? Math.random;
  const newRequestId = options.newRequestId ?? defaultRequestId;

  async function attemptOnce<T>(request: HttpRequest<T>, requestId: string): Promise<T> {
    const timeoutMs = request.timeoutMs ?? options.defaultTimeoutMs;
    validateTimeout(timeoutMs);
    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = request.signal ? AbortSignal.any([request.signal, timeout]) : timeout;
    const headers = mergeHeaders(
      {
        accept: 'application/json',
        ...(options.getLanguage ? { 'accept-language': options.getLanguage() } : {}),
        ...(request.body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      options.defaultHeaders?.(),
      request.headers,
      {
        'x-request-id': requestId,
        ...(request.idempotencyKey ? { 'idempotency-key': request.idempotencyKey } : {}),
      },
    );
    const transportRequest = {
      url: buildUrl(options.baseUrl, request.path, request.query),
      method: request.method,
      headers,
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
      signal,
    };

    let response: TransportResponse;
    try {
      response = await transport(transportRequest);
    } catch (cause) {
      if (request.signal?.aborted) throw new CancelledError({ cause, requestId });
      if (timeout.aborted) throw new TimeoutError(timeoutMs, { cause, requestId });
      throw new NetworkError({ cause, requestId });
    }

    if (response.status < 200 || response.status >= 300) {
      throw toHttpError(response, requestId);
    }

    try {
      return request.parse(response.body);
    } catch (cause) {
      const issue = cause instanceof Error ? cause.message : String(cause);
      throw new ResponseContractError([issue], { cause, requestId });
    }
  }

  return {
    send: async <T>(request: HttpRequest<T>): Promise<T> => {
      const requestId = newRequestId();
      const policy =
        request.retry === false
          ? { ...DEFAULT_RETRY_POLICY, maxAttempts: 1 }
          : (request.retry ?? DEFAULT_RETRY_POLICY);
      const started = Date.now();

      for (let attempt = 1; ; attempt += 1) {
        try {
          const result = await attemptOnce(request, requestId);
          options.logger.debug('http.ok', {
            requestId,
            method: request.method,
            path: request.path,
            attempt,
            ms: Date.now() - started,
          });
          return result;
        } catch (error) {
          const appError = isAppError(error) ? error : toAppError(error);
          const retry =
            shouldRetry({
              error: appError,
              attempt,
              method: request.method,
              idempotent: Boolean(request.idempotencyKey),
              policy,
            }) && !request.signal?.aborted;

          options.logger[retry ? 'warn' : 'error']('http.failed', {
            requestId,
            method: request.method,
            path: request.path,
            attempt,
            code: appError.code,
            retry,
            error: appError,
          });

          if (!retry) throw appError;

          const retryAfter =
            appError instanceof HttpError ? parseRetryAfter(appError.retryAfter) : null;
          await sleep(
            retryAfter === null
              ? backoffDelay(attempt, policy, random)
              : Math.min(policy.maxDelayMs, retryAfter),
            request.signal ?? new AbortController().signal,
          );

          if (request.signal?.aborted) {
            throw new CancelledError({ requestId });
          }
        }
      }
    },
  };
}
