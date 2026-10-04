import { describe, expect, it } from '@rstest/core';
import ar from '../../locales/ar.json';
import en from '../../locales/en.json';

const flatten = (value: Record<string, unknown>, prefix = ''): string[] =>
  Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'object' && child !== null
      ? flatten(child as Record<string, unknown>, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

describe('locales', () => {
  it('gives Arabic every English translation key and no additional keys', () => {
    expect(flatten(ar).sort()).toEqual(flatten(en).sort());
  });
});
