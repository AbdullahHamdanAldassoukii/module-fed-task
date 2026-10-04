import { dateParam, isIsoDate, message } from '@repo/i18n';
import { M, type AppMessage } from '../../../lib/i18n';
import type { PassportFieldError, PassportFieldErrorCode, PassportFieldErrorOf } from '../model';

const FIELD_ERROR_MESSAGE = {
  required: () => message(M.errors.required),
  invalidDate: () => message(M.errors.invalidDate),
  expiryNotAfterIssue: ({ issueDate }) =>
    message(M.errors.expiryNotAfterIssue, {
      issueDate: isIsoDate(issueDate) ? dateParam(issueDate) : issueDate,
    }),
  unsupportedType: () => message(M.errors.unsupportedType),
  tooManyFiles: () => message(M.errors.tooManyFiles),
  readFailed: () => message(M.errors.readFailed),
} satisfies { [Code in PassportFieldErrorCode]: (error: PassportFieldErrorOf<Code>) => AppMessage };

export function fieldErrorMessage(error: PassportFieldError): AppMessage {
  const toMessage = FIELD_ERROR_MESSAGE[error.code] as (error: PassportFieldError) => AppMessage;
  return toMessage(error);
}
