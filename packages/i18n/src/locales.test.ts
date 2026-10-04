import { describe, expect, it } from '@rstest/core';
import { SUPPORTED_LOCALES, getDirection, isLocale } from './locales';

describe('locales', () => {
  it('supports exactly en and ar', () => expect(SUPPORTED_LOCALES).toEqual(['en', 'ar']));
  it('ar is rtl, en is ltr', () => {
    expect(getDirection('ar')).toBe('rtl');
    expect(getDirection('en')).toBe('ltr');
  });
  it('isLocale guards unknown values', () => {
    expect(isLocale('ar')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});
