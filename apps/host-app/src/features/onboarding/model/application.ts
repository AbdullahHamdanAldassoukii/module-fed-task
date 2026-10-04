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

export const PASSPORT_FIELDS = [
  'passportNumber',
  'firstName',
  'lastName',
  'issueDate',
  'expiryDate',
  'document',
] as const satisfies readonly (keyof PassportData)[];
export type PassportField = (typeof PASSPORT_FIELDS)[number];

export interface RejectedFields {
  idInfo: Partial<Record<IdInfoField, typeof IdInfoFieldError.REJECTED>>;
  passportRejected: boolean;
  passport: PassportField[];
}

export function rejectedFields(fieldErrors: Record<string, string>): RejectedFields {
  const result: RejectedFields = { idInfo: {}, passportRejected: false, passport: [] };
  const paths = Object.keys(fieldErrors).map((path) => path.split('.'));
  for (const [section, field] of paths) {
    if (section === 'passport') result.passportRejected = true;
    const idInfoField = ID_INFO_FIELDS.find((name) => name === field);
    if (section === 'idInfo' && idInfoField) result.idInfo[idInfoField] = IdInfoFieldError.REJECTED;
  }
  result.passport = PASSPORT_FIELDS.filter((name) =>
    paths.some(([section, field]) => section === 'passport' && field === name),
  );
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
