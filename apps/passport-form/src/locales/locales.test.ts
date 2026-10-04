import { describe, expect, it } from '@rstest/core';
import ar from './ar.json';
import en from './en.json';

function keys(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === 'object' && child !== null
      ? keys(child as Record<string, unknown>, path)
      : [path];
  });
}

describe('passport-form locales', () => {
  it('keeps Arabic translations aligned with English message keys', () => {
    expect(keys(ar).sort()).toEqual(keys(en).sort());
  });
});
