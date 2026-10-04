import {
  parsePassportData,
  parsePassportFormState,
  type PassportDraft,
} from '@repo/passport-contract';
import { z } from 'zod';
import { isIdInfoValid, type IdInfoDraft } from './idInfo';
import { initialWizardState, pendingIdempotencyKey, type WizardState } from './wizardState';

export const DRAFT_STORAGE_KEY = 'onboarding.draft.v1';
export const SUBMITTED_STORAGE_KEY = 'onboarding.submitted.v1';

export interface PersistedDraft {
  passport: PassportDraft;
  idInfo: IdInfoDraft;
  idempotencyKey?: string;
  documentDropped?: true;
}

export interface SubmittedReceipt {
  referenceId: string;
  submittedAt: string;
}

const draftSchema = z.object({
  passport: z.unknown(),
  idInfo: z.object({ idNumber: z.string(), nationality: z.string() }),
  idempotencyKey: z.string().min(1).optional(),
  documentDropped: z.literal(true).optional(),
});

const receiptSchema = z.object({
  referenceId: z.string().min(1),
  submittedAt: z.string().min(1),
});

export function parsePersistedDraft(raw: unknown): PersistedDraft | null {
  const result = draftSchema.safeParse(raw);
  if (!result.success) return null;
  const passport = parsePassportFormState({ valid: false, data: result.data.passport });
  if (!passport.ok) return null;

  const { idInfo, idempotencyKey, documentDropped } = result.data;
  return {
    passport: passport.value.data,
    idInfo,
    ...(idempotencyKey ? { idempotencyKey } : {}),
    ...(documentDropped ? { documentDropped } : {}),
  };
}

export function parseSubmittedReceipt(raw: unknown): SubmittedReceipt | null {
  const result = receiptSchema.safeParse(raw);
  return result.success ? result.data : null;
}

function isEmptyDraft(draft: PersistedDraft): boolean {
  const { passport, idInfo } = draft;
  const texts = [
    passport.passportNumber,
    passport.firstName,
    passport.lastName,
    passport.issueDate,
    passport.expiryDate,
    idInfo.idNumber,
    idInfo.nationality,
  ];
  return (
    draft.idempotencyKey === undefined &&
    passport.document === null &&
    texts.every((value) => value === '')
  );
}

export function toPersistedDraft(state: WizardState): PersistedDraft | null {
  if (state.submission.status === 'succeeded') return null;
  const idempotencyKey = pendingIdempotencyKey(state.submission);
  const draft: PersistedDraft = {
    passport: state.passport.data,
    idInfo: state.idInfo.values,
    ...(idempotencyKey ? { idempotencyKey } : {}),
    ...(state.documentDropped ? { documentDropped: true as const } : {}),
  };
  return isEmptyDraft(draft) ? null : draft;
}

export function withoutDocument(draft: PersistedDraft): PersistedDraft {
  return { ...draft, passport: { ...draft.passport, document: null }, documentDropped: true };
}

export function toSubmittedReceipt(state: WizardState): SubmittedReceipt | null {
  const { submission } = state;
  return submission.status === 'succeeded'
    ? { referenceId: submission.referenceId, submittedAt: submission.submittedAt }
    : null;
}

export function restoreWizardState(
  draft: PersistedDraft | null,
  receipt: SubmittedReceipt | null,
): WizardState<never> {
  if (receipt) {
    return {
      ...initialWizardState,
      submission: { status: 'succeeded', ...receipt, summary: null, payload: null },
    };
  }
  if (!draft) return initialWizardState;

  const passport = parsePassportData(draft.passport);
  return {
    passport: passport.ok
      ? { valid: true, data: passport.value }
      : { valid: false, data: draft.passport },
    idInfo: { values: draft.idInfo, valid: isIdInfoValid(draft.idInfo) },
    submission: draft.idempotencyKey
      ? { status: 'idle', idempotencyKey: draft.idempotencyKey }
      : { status: 'idle' },
    documentDropped: draft.documentDropped === true && draft.passport.document === null,
  };
}
