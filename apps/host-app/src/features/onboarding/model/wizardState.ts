import { EMPTY_PASSPORT_DRAFT, type PassportFormState } from '@repo/passport-contract';

export interface WizardState {
  passport: PassportFormState;
}

export type WizardAction =
  { type: 'passportChanged'; state: PassportFormState } | { type: 'reset' };

export const initialWizardState: WizardState = {
  passport: { valid: false, data: EMPTY_PASSPORT_DRAFT },
};

function sameState(left: PassportFormState, right: PassportFormState): boolean {
  const leftData = left.data;
  const rightData = right.data;
  const leftDocument = leftData.document;
  const rightDocument = rightData.document;

  const sameDocument =
    leftDocument === rightDocument ||
    (leftDocument !== null &&
      rightDocument !== null &&
      leftDocument.fileName === rightDocument.fileName &&
      leftDocument.mimeType === rightDocument.mimeType &&
      leftDocument.base64 === rightDocument.base64);

  return (
    left.valid === right.valid &&
    leftData.passportNumber === rightData.passportNumber &&
    leftData.firstName === rightData.firstName &&
    leftData.lastName === rightData.lastName &&
    leftData.issueDate === rightData.issueDate &&
    leftData.expiryDate === rightData.expiryDate &&
    sameDocument
  );
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'passportChanged':
      return sameState(state.passport, action.state) ? state : { ...state, passport: action.state };
    case 'reset':
      return initialWizardState;
  }
}
