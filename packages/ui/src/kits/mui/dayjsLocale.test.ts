import { describe, expect, it } from '@rstest/core';
import dayjs from 'dayjs';
import preParsePostFormat from 'dayjs/plugin/preParsePostFormat';
import { dayjsLocaleFor, registerDayjsLocales } from './dayjsLocale';

describe('dayjs locales', () => {
  it('Arabic uses Arabic month names but Latin digits', () => {
    registerDayjsLocales();
    const d = dayjs('2024-01-15').locale(dayjsLocaleFor('ar'));
    expect(d.format('YYYY-MM-DD')).toBe('2024-01-15');
    expect(d.format('MMMM')).not.toBe('January');
  });
  it('English stays English', () => {
    registerDayjsLocales();
    expect(dayjs('2024-01-15').locale(dayjsLocaleFor('en')).format('MMMM')).toBe('January');
  });
  it('keeps Latin digits when the page turns on dayjs number conversion', () => {
    registerDayjsLocales();
    dayjs.extend(preParsePostFormat);
    expect(dayjs('2024-01-15').locale('ar').format('YYYY')).toBe('٢٠٢٤');
    const d = dayjs('2024-01-15').locale(dayjsLocaleFor('ar'));
    expect(d.format('YYYY-MM-DD')).toBe('2024-01-15');
    expect(dayjs('2024-01-15', 'YYYY-MM-DD', dayjsLocaleFor('ar')).format('YYYY-MM-DD')).toBe(
      '2024-01-15',
    );
  });
});
