import { describe, expect, it } from '@rstest/core';
import tokensCss from '../styles/tokens.css?raw';
import { spacing } from './tokens';

describe('design tokens', () => {
  it('emit the spacing step as --spacing, which every Tailwind spacing utility reads', () => {
    const root = /^:root \{([^}]*)\}/m.exec(tokensCss)?.[1];
    expect(root).toContain(`--spacing: ${spacing};`);
  });
});
