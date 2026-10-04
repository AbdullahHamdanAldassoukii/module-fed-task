export type PassportFieldError =
  | { readonly code: 'required' }
  | { readonly code: 'invalidDate' }
  | { readonly code: 'expiryNotAfterIssue'; readonly issueDate: string }
  | { readonly code: 'unsupportedType' }
  | { readonly code: 'tooManyFiles' }
  | { readonly code: 'readFailed' };

export type PassportFieldErrorCode = PassportFieldError['code'];

export type PassportFieldErrorOf<Code extends PassportFieldErrorCode> = Extract<
  PassportFieldError,
  { code: Code }
>;

export const PassportFieldError = Object.freeze({
  REQUIRED: Object.freeze({ code: 'required' }),
  INVALID_DATE: Object.freeze({ code: 'invalidDate' }),
  EXPIRY_NOT_AFTER_ISSUE: (issueDate: string): PassportFieldErrorOf<'expiryNotAfterIssue'> =>
    Object.freeze({ code: 'expiryNotAfterIssue', issueDate }),
  UNSUPPORTED_TYPE: Object.freeze({ code: 'unsupportedType' }),
  TOO_MANY_FILES: Object.freeze({ code: 'tooManyFiles' }),
  READ_FAILED: Object.freeze({ code: 'readFailed' }),
} as const);
