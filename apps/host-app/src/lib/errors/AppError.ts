export type ErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'HTTP'
  | 'VALIDATION'
  | 'RESPONSE_CONTRACT'
  | 'REMOTE_LOAD'
  | 'REMOTE_CONTRACT'
  | 'CONFIG'
  | 'CANCELLED'
  | 'UNKNOWN';

export interface AppErrorOptions {
  cause?: unknown;
  retryable?: boolean;
  requestId?: string;
}

export abstract class AppError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly requestId: string | undefined;

  constructor(code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.requestId = options.requestId;
  }
}

export class NetworkError extends AppError {
  override readonly name = 'NetworkError';

  constructor(options: AppErrorOptions = {}) {
    super('NETWORK', 'The network request failed', { retryable: true, ...options });
  }
}

export class TimeoutError extends AppError {
  override readonly name = 'TimeoutError';

  constructor(
    readonly timeoutMs: number,
    options: AppErrorOptions = {},
  ) {
    super('TIMEOUT', `The request timed out after ${timeoutMs}ms`, { retryable: true, ...options });
  }
}

export class HttpError extends AppError {
  override readonly name = 'HttpError';
  readonly retryAfter: string | null;

  constructor(
    readonly status: number,
    readonly body: unknown,
    options: AppErrorOptions & { retryAfter?: string | null } = {},
  ) {
    const { retryAfter = null, ...rest } = options;
    super('HTTP', `The server responded with ${status}`, {
      retryable: status >= 500 || status === 408 || status === 429,
      ...rest,
    });
    this.retryAfter = retryAfter;
  }
}

export class ValidationError extends AppError {
  override readonly name = 'ValidationError';

  constructor(
    readonly fieldErrors: Record<string, string>,
    options: AppErrorOptions = {},
  ) {
    super('VALIDATION', 'The server rejected some fields', options);
  }
}

export class ResponseContractError extends AppError {
  override readonly name = 'ResponseContractError';

  constructor(
    readonly issues: string[],
    options: AppErrorOptions = {},
  ) {
    super('RESPONSE_CONTRACT', `Unexpected response shape: ${issues.join('; ')}`, options);
  }
}

export class RemoteLoadError extends AppError {
  override readonly name = 'RemoteLoadError';

  constructor(
    readonly reason: 'timeout' | 'load-failed',
    options: AppErrorOptions = {},
  ) {
    super('REMOTE_LOAD', `The remote module could not be loaded (${reason})`, {
      retryable: true,
      ...options,
    });
  }
}

export class RemoteContractError extends AppError {
  override readonly name = 'RemoteContractError';

  constructor(
    readonly details: string,
    options: AppErrorOptions = {},
  ) {
    super('REMOTE_CONTRACT', `The remote violated its contract: ${details}`, options);
  }
}

export class ConfigError extends AppError {
  override readonly name = 'ConfigError';

  constructor(message: string, options: AppErrorOptions = {}) {
    super('CONFIG', message, options);
  }
}

export class CancelledError extends AppError {
  override readonly name = 'CancelledError';

  constructor(options: AppErrorOptions = {}) {
    super('CANCELLED', 'The request was cancelled', options);
  }
}

export class UnknownError extends AppError {
  override readonly name = 'UnknownError';

  constructor(options: AppErrorOptions & { message?: string } = {}) {
    const { message = 'Something went wrong', ...appErrorOptions } = options;
    super('UNKNOWN', message, appErrorOptions);
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

export function toAppError(value: unknown): AppError {
  if (isAppError(value)) return value;
  return new UnknownError({
    cause: value,
    ...(value instanceof Error ? { message: value.message } : {}),
  });
}
