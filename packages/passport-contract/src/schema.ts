import { z } from 'zod';
import { ACCEPTED_MIME_TYPES, isExpiryAfterIssue, isIsoDate } from './rules';
import type { ParseResult, PassportData, PassportDraft, PassportFormState } from './types';

const nonEmpty = z.string().trim().min(1);
const isoDate = z.string().refine(isIsoDate, 'must be a YYYY-MM-DD calendar date');
const base64 = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9+/]+={0,2}$/, 'must be raw base64 without a data: prefix');

const documentSchema = z.object({
  fileName: nonEmpty,
  mimeType: z.enum(ACCEPTED_MIME_TYPES),
  base64,
});

const passportDataSchema = z
  .object({
    passportNumber: nonEmpty,
    firstName: nonEmpty,
    lastName: nonEmpty,
    issueDate: isoDate,
    expiryDate: isoDate,
    document: documentSchema,
  })
  .refine((d) => isExpiryAfterIssue(d.issueDate, d.expiryDate), {
    path: ['expiryDate'],
    message: 'expiryDate must be strictly after issueDate',
  });

const passportDraftSchema = z.object({
  passportNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  issueDate: z.string(),
  expiryDate: z.string(),
  document: documentSchema.nullable(),
});

const formStateSchema = z.discriminatedUnion('valid', [
  z.object({ valid: z.literal(true), data: passportDataSchema }),
  z.object({ valid: z.literal(false), data: passportDraftSchema }),
]);

function toResult<T>(r: z.ZodSafeParseResult<T>): ParseResult<T> {
  return r.success
    ? { ok: true, value: r.data }
    : {
        ok: false,
        issues: r.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
      };
}

export function parsePassportData(input: unknown): ParseResult<PassportData> {
  return toResult(passportDataSchema.safeParse(input));
}

export function parsePassportFormState(input: unknown): ParseResult<PassportFormState> {
  return toResult(formStateSchema.safeParse(input));
}

export const EMPTY_PASSPORT_DRAFT: Readonly<PassportDraft> = Object.freeze({
  passportNumber: '',
  firstName: '',
  lastName: '',
  issueDate: '',
  expiryDate: '',
  document: null,
});
