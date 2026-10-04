import { describe, expect, it } from '@rstest/core';
import { isAcceptedMimeType, isExpiryAfterIssue, isIsoDate } from './rules';

describe('isIsoDate', () => {
  it('accepts YYYY-MM-DD calendar dates', () => {
    expect(isIsoDate('2024-01-15')).toBe(true);
    expect(isIsoDate('2024-02-29')).toBe(true);
  });
  it('rejects malformed or impossible dates', () => {
    expect(isIsoDate('')).toBe(false);
    expect(isIsoDate('15-01-2024')).toBe(false);
    expect(isIsoDate('2024-13-01')).toBe(false);
    expect(isIsoDate('2023-02-29')).toBe(false);
    expect(isIsoDate('2024-01-15T00:00:00Z')).toBe(false);
  });
});

describe('isExpiryAfterIssue', () => {
  it('is true only when expiry is strictly after issue', () => {
    expect(isExpiryAfterIssue('2024-01-15', '2034-01-14')).toBe(true);
    expect(isExpiryAfterIssue('2024-01-15', '2024-01-16')).toBe(true);
    expect(isExpiryAfterIssue('2024-01-15', '2024-01-15')).toBe(false);
    expect(isExpiryAfterIssue('2024-01-15', '2023-12-31')).toBe(false);
  });
  it('is false when either date is invalid', () => {
    expect(isExpiryAfterIssue('', '2034-01-14')).toBe(false);
    expect(isExpiryAfterIssue('2024-01-15', 'nope')).toBe(false);
  });
});

describe('isAcceptedMimeType', () => {
  it('accepts exactly the four assessment types, including image/jpg', () => {
    for (const t of ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'])
      expect(isAcceptedMimeType(t)).toBe(true);
  });
  it('rejects others and is case-sensitive like the browser', () => {
    expect(isAcceptedMimeType('image/gif')).toBe(false);
    expect(isAcceptedMimeType('')).toBe(false);
    expect(isAcceptedMimeType('application/PDF')).toBe(false);
  });
});
