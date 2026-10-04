import { z } from 'zod';

export interface IdInfoDraft {
  idNumber: string;
  nationality: string;
}

export interface IdInfo {
  idNumber: string;
  nationality: NationalityCode;
}

export type IdInfoField = keyof IdInfoDraft;

export const ID_INFO_FIELDS = ['idNumber', 'nationality'] as const satisfies readonly IdInfoField[];

export const EMPTY_ID_INFO: IdInfoDraft = Object.freeze({ idNumber: '', nationality: '' });

export const IdInfoFieldError = {
  REQUIRED: 'required',
  EMIRATES_ID_FORMAT: 'emiratesIdFormat',
  REJECTED: 'rejected',
} as const;
export type IdInfoFieldErrorCode = (typeof IdInfoFieldError)[keyof typeof IdInfoFieldError];

const EMIRATES_ID_GROUPS = [3, 4, 7, 1] as const;
const EMIRATES_ID_LENGTH = 15;
const EMIRATES_ID_PREFIX = '784';

const digitsOf = (value: string) => value.replace(/\D/g, '');

export function formatEmiratesId(value: string): string {
  const digits = digitsOf(value).slice(0, EMIRATES_ID_LENGTH);
  const groups: string[] = [];
  let start = 0;
  for (const size of EMIRATES_ID_GROUPS) {
    if (start >= digits.length) break;
    groups.push(digits.slice(start, start + size));
    start += size;
  }
  return groups.join('-');
}

export function maskEmiratesId(raw: string, caret: number): { value: string; caret: number } {
  const value = formatEmiratesId(raw);
  const digitsBeforeCaret = Math.min(digitsOf(raw.slice(0, caret)).length, EMIRATES_ID_LENGTH);
  if (digitsBeforeCaret === 0) return { value, caret: 0 };

  let seen = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index] ?? '')) seen += 1;
    if (seen === digitsBeforeCaret) return { value, caret: index + 1 };
  }
  return { value, caret: value.length };
}

export function isEmiratesId(value: string): boolean {
  const digits = digitsOf(value);
  return digits.length === EMIRATES_ID_LENGTH && digits.startsWith(EMIRATES_ID_PREFIX);
}

function idNumberError(value: string): IdInfoFieldErrorCode | undefined {
  const compact = value.replace(/[\s-]/g, '');
  if (compact === '') return IdInfoFieldError.REQUIRED;
  if (!/^\d+$/.test(compact) || !isEmiratesId(compact)) return IdInfoFieldError.EMIRATES_ID_FORMAT;
  return undefined;
}

export const NATIONALITY_CODES = [
  'AE',
  'SA',
  'KW',
  'QA',
  'BH',
  'OM',
  'EG',
  'JO',
  'IN',
  'PK',
  'PH',
  'GB',
] as const;
export type NationalityCode = (typeof NATIONALITY_CODES)[number];

export function isNationalityCode(value: string): value is NationalityCode {
  return (NATIONALITY_CODES as readonly string[]).includes(value);
}

const regionNames = new Map<string, Intl.DisplayNames>();

export function nationalityName(code: string, locale: string): string {
  let names = regionNames.get(locale);
  if (!names) {
    names = new Intl.DisplayNames([locale], { type: 'region', fallback: 'code' });
    regionNames.set(locale, names);
  }
  return names.of(code) ?? code;
}

export function nationalityOptions(locale: string): { value: NationalityCode; label: string }[] {
  const collator = new Intl.Collator(locale);
  return NATIONALITY_CODES.map((code) => ({
    value: code,
    label: nationalityName(code, locale),
  })).sort((left, right) => collator.compare(left.label, right.label));
}

export const idInfoSchema = z
  .object({ idNumber: z.string(), nationality: z.string() })
  .superRefine((values, context) => {
    const idNumber = idNumberError(values.idNumber);
    if (idNumber) context.addIssue({ code: 'custom', path: ['idNumber'], message: idNumber });
    if (!isNationalityCode(values.nationality)) {
      context.addIssue({
        code: 'custom',
        path: ['nationality'],
        message: IdInfoFieldError.REQUIRED,
      });
    }
  });

export function isIdInfoValid(values: IdInfoDraft): boolean {
  return idInfoSchema.safeParse(values).success;
}

export function parseIdInfo(values: IdInfoDraft): IdInfo | null {
  if (!isIdInfoValid(values) || !isNationalityCode(values.nationality)) return null;
  return { idNumber: formatEmiratesId(values.idNumber), nationality: values.nationality };
}
