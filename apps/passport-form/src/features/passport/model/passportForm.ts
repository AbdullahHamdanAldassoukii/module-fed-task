import {
  isAcceptedMimeType,
  isExpiryAfterIssue,
  isIsoDate,
  parsePassportData,
  type PassportData,
  type PassportDocument,
  type PassportDraft,
} from '@repo/passport-contract';
import { PassportFieldError } from './passportFieldError';

export type DocumentValue =
  | { readonly status: 'empty' }
  | {
      readonly status: 'reading';
      readonly fileName: string;
      readonly mimeType: string;
      readonly sizeBytes: number;
    }
  | { readonly status: 'ready'; readonly document: PassportDocument }
  | { readonly status: 'rejected'; readonly error: PassportFieldError };

export const EMPTY_DOCUMENT: DocumentValue = Object.freeze({ status: 'empty' });

export interface PassportFormValues {
  passportNumber: string;
  firstName: string;
  lastName: string;
  issueDate: string;
  expiryDate: string;
  document: DocumentValue;
}

export type PassportField = keyof PassportFormValues;

export type PassportFieldErrors = Readonly<Record<PassportField, PassportFieldError | undefined>>;

export type PassportEvaluation =
  | { readonly valid: true; readonly errors: PassportFieldErrors; readonly data: PassportData }
  | { readonly valid: false; readonly errors: PassportFieldErrors; readonly data: PassportDraft };

export function passportFormValuesFrom(draft: PassportDraft | undefined): PassportFormValues {
  if (!draft) {
    return {
      passportNumber: '',
      firstName: '',
      lastName: '',
      issueDate: '',
      expiryDate: '',
      document: EMPTY_DOCUMENT,
    };
  }
  return {
    passportNumber: draft.passportNumber,
    firstName: draft.firstName,
    lastName: draft.lastName,
    issueDate: draft.issueDate,
    expiryDate: draft.expiryDate,
    document: draft.document ? { status: 'ready', document: draft.document } : EMPTY_DOCUMENT,
  };
}

function textError(value: string): PassportFieldError | undefined {
  return value === '' ? PassportFieldError.REQUIRED : undefined;
}

function dateError(value: string): PassportFieldError | undefined {
  if (value === '') return PassportFieldError.REQUIRED;
  return isIsoDate(value) ? undefined : PassportFieldError.INVALID_DATE;
}

function expiryError(issueDate: string, expiryDate: string): PassportFieldError | undefined {
  const ownError = dateError(expiryDate);
  if (ownError) return ownError;
  if (!isIsoDate(issueDate) || isExpiryAfterIssue(issueDate, expiryDate)) return undefined;
  return PassportFieldError.EXPIRY_NOT_AFTER_ISSUE(issueDate);
}

function documentError(value: DocumentValue): PassportFieldError | undefined {
  switch (value.status) {
    case 'empty':
      return PassportFieldError.REQUIRED;
    case 'reading':
      return undefined;
    case 'rejected':
      return value.error;
    case 'ready':
      return isAcceptedMimeType(value.document.mimeType)
        ? undefined
        : PassportFieldError.UNSUPPORTED_TYPE;
  }
}

export function evaluatePassportForm(values: PassportFormValues): PassportEvaluation {
  const data: PassportDraft = {
    passportNumber: values.passportNumber.trim(),
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    issueDate: values.issueDate.trim(),
    expiryDate: values.expiryDate.trim(),
    document: values.document.status === 'ready' ? values.document.document : null,
  };
  const errors: PassportFieldErrors = {
    passportNumber: textError(data.passportNumber),
    firstName: textError(data.firstName),
    lastName: textError(data.lastName),
    issueDate: dateError(data.issueDate),
    expiryDate: expiryError(data.issueDate, data.expiryDate),
    document: documentError(values.document),
  };
  const hasError = Object.values(errors).some((error) => error !== undefined);
  if (!hasError && values.document.status === 'ready') {
    const parsed = parsePassportData(data);
    if (parsed.ok) return { valid: true, errors, data: parsed.value };
  }
  return { valid: false, errors, data };
}

export function documentSelectionError(
  files: readonly { mimeType: string }[],
): PassportFieldError | undefined {
  const [first, ...rest] = files;
  if (!first) return PassportFieldError.REQUIRED;
  if (rest.length > 0) return PassportFieldError.TOO_MANY_FILES;
  return isAcceptedMimeType(first.mimeType) ? undefined : PassportFieldError.UNSUPPORTED_TYPE;
}

export function earliestExpiryDate(issueDate: string): string | undefined {
  if (!isIsoDate(issueDate)) return undefined;
  const next = new Date(`${issueDate}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}
