import type { PassportDraft, PassportFormState } from '@repo/passport-contract';

function sameDocument(left: PassportDraft['document'], right: PassportDraft['document']) {
  if (left === right) return true;
  if (!left || !right) return false;
  return (
    left.fileName === right.fileName &&
    left.mimeType === right.mimeType &&
    left.base64 === right.base64
  );
}

export function sameFormState(left: PassportFormState, right: PassportFormState): boolean {
  return (
    left.valid === right.valid &&
    left.data.passportNumber === right.data.passportNumber &&
    left.data.firstName === right.data.firstName &&
    left.data.lastName === right.data.lastName &&
    left.data.issueDate === right.data.issueDate &&
    left.data.expiryDate === right.data.expiryDate &&
    sameDocument(left.data.document, right.data.document)
  );
}
