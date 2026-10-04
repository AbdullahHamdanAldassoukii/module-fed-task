import { describe, expect, it } from '@rstest/core';
import { ROOT, scopeSelector } from '../postcss.config.mjs';

describe('remote CSS selector scoping', () => {
  it('maps remote selectors without inheriting the host dark class', () => {
    const darkUtility = '.dark\\:bg-input\\/30:is(.dark *)';
    const mappings = [
      [':root', ROOT],
      [':root,:host', ROOT],
      ['html', ROOT],
      ['body', ROOT],
      ['.dark', `${ROOT}.dark`],
      ['.dark *', `${ROOT}.dark *`],
      [darkUtility, `${ROOT} .dark\\:bg-input\\/30:is(${ROOT}.dark *)`],
      ['.btn', `${ROOT} .btn`],
    ] as const;

    for (const [selector, expected] of mappings) {
      expect(scopeSelector(ROOT, selector, `${ROOT} ${selector}`)).toBe(expected);
    }
  });
});
