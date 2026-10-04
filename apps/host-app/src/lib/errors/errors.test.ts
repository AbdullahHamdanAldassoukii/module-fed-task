import { describe, expect, it } from '@rstest/core';
import {
  CancelledError,
  ConfigError,
  HttpError,
  NetworkError,
  RemoteContractError,
  RemoteLoadError,
  ResponseContractError,
  TimeoutError,
  UnknownError,
  ValidationError,
  errorPresentation,
  toAppError,
} from './index';
import { M } from '../i18n';

describe('errors', () => {
  it('makes 5xx, 408, and 429 retryable but not other 4xx responses', () => {
    expect(new HttpError(503, null).retryable).toBe(true);
    expect(new HttpError(429, null).retryable).toBe(true);
    expect(new HttpError(404, null).retryable).toBe(false);
  });

  it('keeps cause, requestId, and literal error names', () => {
    const cause = new Error('boom');
    const error = new NetworkError({ cause, requestId: 'r1' });
    expect(error.cause).toBe(cause);
    expect(error.requestId).toBe('r1');
    expect(
      [
        new NetworkError(),
        new TimeoutError(5),
        new HttpError(500, null),
        new ValidationError({}),
        new ResponseContractError([]),
        new RemoteLoadError('timeout'),
        new RemoteContractError('bad export'),
        new ConfigError('bad config'),
        new CancelledError(),
        new UnknownError(),
      ].map((appError) => appError.name),
    ).toEqual([
      'NetworkError',
      'TimeoutError',
      'HttpError',
      'ValidationError',
      'ResponseContractError',
      'RemoteLoadError',
      'RemoteContractError',
      'ConfigError',
      'CancelledError',
      'UnknownError',
    ]);
  });

  it('normalizes unknown values', () => {
    expect(toAppError('x').code).toBe('UNKNOWN');
    expect(toAppError(new TimeoutError(5)).code).toBe('TIMEOUT');
  });

  it('offers retry only when it makes sense', () => {
    expect(errorPresentation(new HttpError(500, null)).action).toBe('retry');
    expect(errorPresentation(new HttpError(404, null)).action).toBe('none');
    expect(errorPresentation(new NetworkError()).message).toBe(M.errors.network);
  });
});
