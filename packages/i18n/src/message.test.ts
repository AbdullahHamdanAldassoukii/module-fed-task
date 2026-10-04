import { describe, expect, it } from '@rstest/core';
import { dateParam, isIsoDate, type TranslationVars } from './message';

describe('message parameters', () => {
  it('rejects invalid calendar dates before they can reach a render', () => {
    expect(() => dateParam('2026-13-45')).toThrow(TypeError);
    expect(() => dateParam('2026-02-30')).toThrow(TypeError);
  });

  it('narrows valid ISO dates for date parameters', () => {
    const candidate = '2026-10-04';

    expect(isIsoDate(candidate)).toBe(true);
    if (!isIsoDate(candidate)) throw new Error('Expected a valid ISO date');
    expect(dateParam(candidate).iso).toBe('2026-10-04');
  });

  it('rejects reserved i18next option names as interpolation variables', () => {
    const vars: TranslationVars = { name: 'Sara' };
    // @ts-expect-error reserved option
    const reserved: TranslationVars = { count: 1 };

    expect(vars.name).toBe('Sara');
    expect(reserved).toBeDefined();
  });
});
