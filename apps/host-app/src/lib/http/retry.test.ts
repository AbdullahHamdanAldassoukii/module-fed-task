import { describe, expect, it } from '@rstest/core';
import { HttpError, NetworkError, TimeoutError, ValidationError } from '../errors';
import { backoffDelay, parseRetryAfter, shouldRetry } from './retry';
import { DEFAULT_RETRY_POLICY } from './types';

describe('shouldRetry', () => {
  const policy = DEFAULT_RETRY_POLICY;

  it('retries GET on network, timeout and 5xx within maxAttempts', () => {
    expect(
      shouldRetry({
        error: new NetworkError(),
        attempt: 1,
        method: 'GET',
        idempotent: false,
        policy,
      }),
    ).toBe(true);
    expect(
      shouldRetry({
        error: new TimeoutError(10),
        attempt: 2,
        method: 'GET',
        idempotent: false,
        policy,
      }),
    ).toBe(true);
    expect(
      shouldRetry({
        error: new HttpError(503, null),
        attempt: 1,
        method: 'GET',
        idempotent: false,
        policy,
      }),
    ).toBe(true);
    expect(
      shouldRetry({
        error: new HttpError(503, null),
        attempt: 3,
        method: 'GET',
        idempotent: false,
        policy,
      }),
    ).toBe(false);
  });

  it('never retries a POST without an idempotency key, but does with one', () => {
    expect(
      shouldRetry({
        error: new NetworkError(),
        attempt: 1,
        method: 'POST',
        idempotent: false,
        policy,
      }),
    ).toBe(false);
    expect(
      shouldRetry({
        error: new NetworkError(),
        attempt: 1,
        method: 'POST',
        idempotent: true,
        policy,
      }),
    ).toBe(true);
  });

  it('never retries 4xx except 408/429, never validation errors', () => {
    expect(
      shouldRetry({
        error: new HttpError(404, null),
        attempt: 1,
        method: 'GET',
        idempotent: false,
        policy,
      }),
    ).toBe(false);
    expect(
      shouldRetry({
        error: new HttpError(429, null),
        attempt: 1,
        method: 'GET',
        idempotent: false,
        policy,
      }),
    ).toBe(true);
    expect(
      shouldRetry({
        error: new ValidationError({}),
        attempt: 1,
        method: 'GET',
        idempotent: false,
        policy,
      }),
    ).toBe(false);
  });
});

describe('backoffDelay', () => {
  it('grows exponentially with jitter and caps at maxDelayMs', () => {
    const policy = { maxAttempts: 5, baseDelayMs: 100, maxDelayMs: 350 };
    expect(backoffDelay(1, policy, () => 0)).toBe(100);
    expect(backoffDelay(2, policy, () => 0)).toBe(200);
    expect(backoffDelay(3, policy, () => 0)).toBe(350);
    expect(backoffDelay(1, policy, () => 1)).toBe(150);
  });

  it('prefers Retry-After when given', () => {
    expect(parseRetryAfter('2')).toBe(2000);
    expect(parseRetryAfter(null)).toBeNull();
    expect(parseRetryAfter('garbage')).toBeNull();
    const soon = new Date(Date.now() + 1500).toUTCString();
    const ms = parseRetryAfter(soon);
    expect(ms).not.toBeNull();
    expect(ms!).toBeGreaterThan(0);
    expect(ms!).toBeLessThanOrEqual(1500);
  });
});
