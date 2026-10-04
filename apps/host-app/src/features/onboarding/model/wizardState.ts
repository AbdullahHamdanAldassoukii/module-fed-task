import { EMPTY_PASSPORT_DRAFT, type PassportFormState } from '@repo/passport-contract';
import {
  buildApplicationSummary,
  type ApplicationPayload,
  type ApplicationSummary,
} from './application';
import { EMPTY_ID_INFO, isIdInfoValid, type IdInfoDraft } from './idInfo';

export type Submission<TError = unknown> =
  | {
      status: 'idle';
      idempotencyKey?: string;
    }
  | { status: 'submitting'; idempotencyKey: string }
  | { status: 'failed'; idempotencyKey: string; error: TError; payload: ApplicationPayload }
  | {
      status: 'succeeded';
      referenceId: string;
      submittedAt: string;
      summary: ApplicationSummary | null;
      payload: ApplicationPayload | null;
    };

export interface WizardState<TError = unknown> {
  passport: PassportFormState;
  idInfo: { values: IdInfoDraft; valid: boolean };
  submission: Submission<TError>;
  documentDropped: boolean;
}

export type WizardAction<TError = unknown> =
  | { type: 'passportChanged'; state: PassportFormState }
  | { type: 'idInfoChanged'; values: IdInfoDraft }
  | { type: 'submitStarted'; idempotencyKey: string }
  | { type: 'submitFailed'; idempotencyKey: string; error: TError; payload: ApplicationPayload }
  | {
      type: 'submitSucceeded';
      idempotencyKey: string;
      referenceId: string;
      submittedAt: string;
      payload: ApplicationPayload;
    }
  | { type: 'reset' };

export const initialWizardState: WizardState<never> = {
  passport: { valid: false, data: EMPTY_PASSPORT_DRAFT },
  idInfo: { values: EMPTY_ID_INFO, valid: false },
  submission: { status: 'idle' },
  documentDropped: false,
};

export function pendingIdempotencyKey(submission: Submission<unknown>): string | undefined {
  return submission.status === 'succeeded' ? undefined : submission.idempotencyKey;
}

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

function isAwaiting(submission: Submission<unknown>, idempotencyKey: string): boolean {
  return submission.status === 'submitting' && submission.idempotencyKey === idempotencyKey;
}

export function wizardReducer<TError>(
  state: WizardState<TError>,
  action: WizardAction<TError>,
): WizardState<TError> {
  switch (action.type) {
    case 'passportChanged':
      if (sameState(state.passport, action.state)) return state;
      return {
        ...state,
        passport: action.state,
        documentDropped: state.documentDropped && action.state.data.document === null,
      };
    case 'idInfoChanged': {
      const { values } = state.idInfo;
      if (
        values.idNumber === action.values.idNumber &&
        values.nationality === action.values.nationality
      ) {
        return state;
      }
      return {
        ...state,
        idInfo: { values: action.values, valid: isIdInfoValid(action.values) },
      };
    }
    case 'submitStarted':
      if (state.submission.status === 'submitting' || state.submission.status === 'succeeded') {
        return state;
      }
      return {
        ...state,
        submission: { status: 'submitting', idempotencyKey: action.idempotencyKey },
      };
    case 'submitFailed':
      if (!isAwaiting(state.submission, action.idempotencyKey)) return state;
      return {
        ...state,
        submission: {
          status: 'failed',
          idempotencyKey: action.idempotencyKey,
          error: action.error,
          payload: action.payload,
        },
      };
    case 'submitSucceeded':
      if (!isAwaiting(state.submission, action.idempotencyKey)) return state;
      return {
        ...initialWizardState,
        submission: {
          status: 'succeeded',
          referenceId: action.referenceId,
          submittedAt: action.submittedAt,
          summary: buildApplicationSummary(action.payload),
          payload: action.payload,
        },
      };
    case 'reset':
      return initialWizardState;
  }
}
