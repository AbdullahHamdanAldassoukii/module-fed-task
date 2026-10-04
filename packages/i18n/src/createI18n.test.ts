import { describe, expect, it } from '@rstest/core';
import { createI18n } from './createI18n';

const resources = {
  en: { translation: { hello: 'Hello', nested: { key: 'Nested' } } },
  ar: { translation: { hello: 'مرحبا' } },
};

describe('createI18n', () => {
  it('returns an initialised instance that translates synchronously', () => {
    const i18n = createI18n({ resources, lng: 'en' });
    expect(i18n.isInitialized).toBe(true);
    expect(i18n.t('hello')).toBe('Hello');
    expect(i18n.t('nested.key')).toBe('Nested');
  });
  it('falls back to English for missing Arabic keys', () => {
    const i18n = createI18n({ resources, lng: 'ar' });
    expect(i18n.t('hello')).toBe('مرحبا');
    expect(i18n.t('nested.key')).toBe('Nested');
  });
  it('creates independent instances (changing one does not change the other)', async () => {
    const a = createI18n({ resources, lng: 'en' });
    const b = createI18n({ resources, lng: 'en' });
    await a.changeLanguage('ar');
    expect(a.language).toBe('ar');
    expect(b.language).toBe('en');
  });
  it('does not escape values (React escapes already)', () => {
    const i18n = createI18n({ resources: { en: { translation: { x: '{{v}}' } } }, lng: 'en' });
    expect(i18n.t('x', { v: '<b>' })).toBe('<b>');
  });
});
