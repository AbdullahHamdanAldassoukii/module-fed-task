import type { ComponentType } from 'react';
import type { AcceptedMimeType } from './rules';

export interface PassportDocument {
  fileName: string;
  mimeType: AcceptedMimeType;
  base64: string;
}

export interface PassportData {
  passportNumber: string;
  firstName: string;
  lastName: string;
  issueDate: string;
  expiryDate: string;
  document: PassportDocument;
}

export type PassportDraft = Omit<PassportData, 'document'> & { document: PassportDocument | null };

export type PassportFormState =
  { valid: true; data: PassportData } | { valid: false; data: PassportDraft };

export type PassportFormLocale = 'en' | 'ar';
export type PassportFormColorScheme = 'light' | 'dark';

export interface PassportFormProps {
  initialValue?: PassportDraft;
  onChange: (state: PassportFormState) => void;
  locale: PassportFormLocale;
  colorScheme: PassportFormColorScheme;
}

export interface PassportFormModule {
  default: ComponentType<PassportFormProps>;
  contractVersion: string;
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; issues: string[] };
