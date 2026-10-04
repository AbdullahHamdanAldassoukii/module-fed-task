import { HttpError, NetworkError, TimeoutError, type AppError } from '../errors';
import type { HttpMethod, RetryPolicy } from './types';

interface ShouldRetryOptions {
  error: AppError;
  attempt: number;
  method: HttpMethod;
  idempotent: boolean;
  policy: RetryPolicy;
}

export function shouldRetry({
  error,
  attempt,
  method,
  idempotent,
  policy,
}: ShouldRetryOptions): boolean {
  if (attempt >= policy.maxAttempts) return false;

  const safe = method === 'GET' || idempotent;
  if (!safe) return false;

  if (error instanceof NetworkError || error instanceof TimeoutError) return true;
  if (error instanceof HttpError) return error.retryable;
  return false;
}

export function backoffDelay(
  attempt: number,
  policy: RetryPolicy,
  random: () => number = Math.random,
): number {
  const exponential = policy.baseDelayMs * 2 ** (attempt - 1);
  const jitter = exponential * 0.5 * random();
  return Math.min(policy.maxDelayMs, Math.round(exponential + jitter));
}

export function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  if (/^\d+$/.test(value)) return Number(value) * 1000;

  const at = Date.parse(value);
  return Number.isNaN(at) ? null : Math.max(0, at - Date.now());
}
