import { describe, expect, it } from '@rstest/core';
import { EMPTY_PASSPORT_DRAFT, parsePassportData, parsePassportFormState } from './schema';

const validData = {
  passportNumber: 'A1234567',
  firstName: 'Ali',
  lastName: 'Hassan',
  issueDate: '2024-01-15',
  expiryDate: '2034-01-14',
  document: { fileName: 'passport.pdf', mimeType: 'application/pdf', base64: 'JVBERi0=' },
};

describe('parsePassportData', () => {
  it('accepts the assessment example', () => {
    expect(parsePassportData(validData)).toEqual({ ok: true, value: validData });
  });
  it('strips unknown fields (tolerant reader)', () => {
    const r = parsePassportData({
      ...validData,
      extra: 1,
      document: { ...validData.document, checksum: 'x' },
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual(validData);
  });
  it('rejects empty strings, bad dates, equal dates, bad mime, data-url base64', () => {
    expect(parsePassportData({ ...validData, firstName: '  ' }).ok).toBe(false);
    expect(parsePassportData({ ...validData, issueDate: '2024-1-5' }).ok).toBe(false);
    expect(parsePassportData({ ...validData, expiryDate: '2024-01-15' }).ok).toBe(false);
    expect(
      parsePassportData({
        ...validData,
        document: { ...validData.document, mimeType: 'image/gif' },
      }).ok,
    ).toBe(false);
    expect(
      parsePassportData({
        ...validData,
        document: { ...validData.document, base64: 'data:application/pdf;base64,JVBERi0=' },
      }).ok,
    ).toBe(false);
  });
  it('reports readable issues', () => {
    const r = parsePassportData({ ...validData, lastName: '' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues[0]).toMatch(/lastName/);
  });
});

describe('parsePassportFormState', () => {
  it('accepts a valid state', () => {
    expect(parsePassportFormState({ valid: true, data: validData }).ok).toBe(true);
  });
  it('rejects valid:true with incomplete data (the host must not trust the flag)', () => {
    expect(parsePassportFormState({ valid: true, data: { ...validData, document: null } }).ok).toBe(
      false,
    );
  });
  it('accepts valid:false with a draft that has empty strings and a null document', () => {
    expect(parsePassportFormState({ valid: false, data: EMPTY_PASSPORT_DRAFT }).ok).toBe(true);
  });
  it('rejects non-objects and wrong shapes', () => {
    expect(parsePassportFormState(null).ok).toBe(false);
    expect(parsePassportFormState({ valid: 'yes', data: {} }).ok).toBe(false);
    expect(parsePassportFormState({ valid: false }).ok).toBe(false);
  });
});
