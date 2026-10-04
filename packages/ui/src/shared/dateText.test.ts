import { describe, expect, it } from '@rstest/core';
import { fromIsoDate, maskDateText, toIsoDate } from './dateText';

describe('maskDateText', () => {
  it('keeps digits only and inserts dashes after year and month', () => {
    expect(maskDateText('2024')).toBe('2024');
    expect(maskDateText('20240')).toBe('2024-0');
    expect(maskDateText('2024-01-1')).toBe('2024-01-1');
    expect(maskDateText('20240115')).toBe('2024-01-15');
    expect(maskDateText('2024/01/15x')).toBe('2024-01-15');
    expect(maskDateText('2024011599')).toBe('2024-01-15');
    expect(maskDateText('')).toBe('');
  });
  it('keeps a separator typed right after the year or the month', () => {
    expect(maskDateText('2024-')).toBe('2024-');
    expect(maskDateText('2024/')).toBe('2024-');
    expect(maskDateText('2024-01-')).toBe('2024-01-');
    expect(maskDateText('2024-01-15-')).toBe('2024-01-15');
    expect(maskDateText('202-')).toBe('202');
  });
  it('turns Arabic-Indic digits from Arabic keyboards into Latin digits', () => {
    expect(maskDateText('٢٠٢٤٠١١٥')).toBe('2024-01-15');
    expect(maskDateText('۲۰۲۴-۰۱')).toBe('2024-01');
  });
});

describe('toIsoDate / fromIsoDate', () => {
  it('parses only complete real dates', () => {
    expect(toIsoDate('2024-01-15')).toEqual(new Date(2024, 0, 15));
    expect(toIsoDate('2024-02-30')).toBeNull();
    expect(toIsoDate('2024-01')).toBeNull();
  });
  it('formats back with Latin digits', () => {
    expect(fromIsoDate(new Date(2034, 0, 14))).toBe('2034-01-14');
  });
});
