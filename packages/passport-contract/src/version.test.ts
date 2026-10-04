import { describe, expect, it } from '@rstest/core';
import { PASSPORT_FORM_CONTRACT_VERSION, isCompatibleContractVersion } from './version';

describe('isCompatibleContractVersion', () => {
  it('accepts the same major, any minor/patch', () => {
    expect(PASSPORT_FORM_CONTRACT_VERSION).toBe('1.0.0');
    expect(isCompatibleContractVersion('1.0.0')).toBe(true);
    expect(isCompatibleContractVersion('1.4.2')).toBe(true);
  });
  it('rejects other majors, garbage, and non-strings', () => {
    expect(isCompatibleContractVersion('2.0.0')).toBe(false);
    expect(isCompatibleContractVersion('0.9.0')).toBe(false);
    expect(isCompatibleContractVersion('1')).toBe(false);
    expect(isCompatibleContractVersion(undefined)).toBe(false);
    expect(isCompatibleContractVersion(1)).toBe(false);
  });
});
