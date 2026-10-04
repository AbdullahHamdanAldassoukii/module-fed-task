import {
  parsePassportData,
  type AcceptedMimeType,
  type PassportData,
} from '@repo/passport-contract';
import { z } from 'zod';
import { ID_INFO_FIELDS, IdInfoFieldError, type IdInfo, type IdInfoField } from './idInfo';

export interface ApplicationPayload {
  passport: PassportData;
  idInfo: IdInfo;
}

/** What the confirmation screen lists; the document's content is left out. */
export interface ApplicationSummary {
  firstName: string;
  lastName: string;
  passportNumber: string;
  issueDate: string;
  expiryDate: string;
  documentName: string;
  documentType: AcceptedMimeType;
  idNumber: string;
  nationality: string;
}

export interface SubmitApplicationResult {
  referenceId: string;
  submittedAt: string;
}

/**
 * The request body, built field by field so its keys and their order are exactly the
 * assessment's example and nothing else travels (the idempotency key is a header).
 */
export function buildApplicationPayload(
  passport: PassportData,
  idInfo: IdInfo,
): ApplicationPayload {
  return {
    passport: {
      passportNumber: passport.passportNumber,
      firstName: passport.firstName,
      lastName: passport.lastName,
      issueDate: passport.issueDate,
      expiryDate: passport.expiryDate,
      document: {
        fileName: passport.document.fileName,
        mimeType: passport.document.mimeType,
        base64: passport.document.base64,
      },
    },
    idInfo: {
      idNumber: idInfo.idNumber,
      nationality: idInfo.nationality,
    },
  };
}

export function buildApplicationSummary(payload: ApplicationPayload): ApplicationSummary {
  const { passport, idInfo } = payload;
  return {
    firstName: passport.firstName,
    lastName: passport.lastName,
    passportNumber: passport.passportNumber,
    issueDate: passport.issueDate,
    expiryDate: passport.expiryDate,
    documentName: passport.document.fileName,
    documentType: passport.document.mimeType,
    idNumber: idInfo.idNumber,
    nationality: idInfo.nationality,
  };
}

const BASE64_PREVIEW_LENGTH = 48;

export function isPayloadPreviewShortened(payload: ApplicationPayload): boolean {
  return payload.passport.document.base64.length > BASE64_PREVIEW_LENGTH;
}

/** Pretty JSON for the screen: the document's base64 is shortened; copies and downloads stay full. */
export function payloadPreviewJson(payload: ApplicationPayload): string {
  const { base64 } = payload.passport.document;
  const preview = isPayloadPreviewShortened(payload)
    ? `${base64.slice(0, BASE64_PREVIEW_LENGTH)}…`
    : base64;
  return JSON.stringify(
    {
      ...payload,
      passport: {
        ...payload.passport,
        document: { ...payload.passport.document, base64: preview },
      },
    },
    null,
    2,
  );
}

export function payloadJson(payload: ApplicationPayload): string {
  return JSON.stringify(payload, null, 2);
}

export interface RejectedFields {
  idInfo: Partial<Record<IdInfoField, typeof IdInfoFieldError.REJECTED>>;
  /** True when the server rejected a passport field, which only Step 1 can fix. */
  passport: boolean;
}

/** Maps a 422 body's field paths (e.g. "idInfo.idNumber") onto the wizard's two forms. */
export function rejectedFields(fieldErrors: Record<string, string>): RejectedFields {
  const result: RejectedFields = { idInfo: {}, passport: false };
  for (const path of Object.keys(fieldErrors)) {
    const [section, field] = path.split('.');
    if (section === 'passport') result.passport = true;
    const idInfoField = ID_INFO_FIELDS.find((name) => name === field);
    if (section === 'idInfo' && idInfoField) result.idInfo[idInfoField] = IdInfoFieldError.REJECTED;
  }
  return result;
}

const submitResultSchema = z.object({
  referenceId: z.string().min(1),
  submittedAt: z.string().min(1),
});

export function parseSubmitApplicationResponse(data: unknown): SubmitApplicationResult {
  const result = submitResultSchema.safeParse(data);
  if (!result.success) {
    throw new Error(
      result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
    );
  }
  return result.data;
}

export { parsePassportData };
