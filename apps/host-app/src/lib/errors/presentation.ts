import { M, type AppMessageKey } from '../i18n';
import type { AppError, ErrorCode } from './AppError';

export type ErrorAction = 'retry' | 'fixInput' | 'none';

export interface ErrorPresentation {
  message: AppMessageKey;
  action: ErrorAction;
  showRequestId: boolean;
}

const table = {
  NETWORK: { message: M.errors.network, action: 'retry', showRequestId: false },
  TIMEOUT: { message: M.errors.timeout, action: 'retry', showRequestId: false },
  HTTP: { message: M.errors.server, action: 'retry', showRequestId: true },
  VALIDATION: { message: M.errors.validation, action: 'fixInput', showRequestId: false },
  RESPONSE_CONTRACT: {
    message: M.errors.unexpectedResponse,
    action: 'none',
    showRequestId: true,
  },
  REMOTE_LOAD: { message: M.errors.remoteUnavailable, action: 'retry', showRequestId: false },
  REMOTE_CONTRACT: {
    message: M.errors.remoteIncompatible,
    action: 'none',
    showRequestId: false,
  },
  CONFIG: { message: M.errors.config, action: 'none', showRequestId: false },
  CANCELLED: { message: M.errors.cancelled, action: 'none', showRequestId: false },
  UNKNOWN: { message: M.errors.unknown, action: 'none', showRequestId: true },
} satisfies Record<ErrorCode, ErrorPresentation>;

export function errorPresentation(error: AppError): ErrorPresentation {
  const base = table[error.code];
  if (error.code === 'HTTP' && !error.retryable) return { ...base, action: 'none' };
  return base;
}
