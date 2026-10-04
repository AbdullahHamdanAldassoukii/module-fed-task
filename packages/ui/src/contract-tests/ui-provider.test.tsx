import { describe, expect, it } from '@rstest/core';
import { screen } from '@testing-library/react';
import { renderKit } from '../testing/renderKit';

describe('UiProvider', () => {
  it('sets dir, lang and the dark class on its root from props only', () => {
    renderKit(<span>x</span>, { direction: 'rtl', locale: 'ar', colorScheme: 'dark' });
    const root = screen.getByTestId('ui-root');
    expect(root).toHaveAttribute('dir', 'rtl');
    expect(root).toHaveAttribute('lang', 'ar');
    expect(root.className).toMatch(/\bdark\b/);
    expect(document.documentElement.getAttribute('dir')).toBeNull();
  });
});
