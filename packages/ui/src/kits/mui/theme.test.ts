import { describe, expect, it } from '@rstest/core';
import { fontFamily, palette } from '../../tokens/tokens';
import { getTheme } from './theme';

describe('MUI theme', () => {
  it('takes its colors from the design tokens, per color scheme', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const theme = getTheme('ltr', scheme);
      const tokens = palette[scheme];
      expect(theme.palette.mode).toBe(scheme);
      expect(theme.palette.primary.main).toBe(tokens.primary);
      expect(theme.palette.error.main).toBe(tokens.destructive);
      expect(theme.palette.text.primary).toBe(tokens.foreground);
      expect(theme.palette.background.default).toBe(tokens.background);
    }
  });
  it('takes radius, spacing and font from the tokens', () => {
    const theme = getTheme('rtl', 'light');
    expect(theme.direction).toBe('rtl');
    expect(theme.shape.borderRadius).toBe(8);
    expect(theme.spacing(1)).toBe('8px');
    expect(theme.typography.fontFamily).toBe(fontFamily);
  });
  it('builds each theme once', () => {
    expect(getTheme('ltr', 'dark')).toBe(getTheme('ltr', 'dark'));
  });
});
