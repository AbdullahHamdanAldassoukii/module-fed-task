import { describe, expect, it } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { palette } from '../../tokens/tokens';
import { UiProvider } from './UiProvider';

const stylesFor = (key: string) =>
  Array.from(
    document.querySelectorAll<HTMLStyleElement>(
      `style[data-emotion="${key}"], style[data-emotion^="${key} "]`,
    ),
  )
    .map((style) => style.textContent)
    .join('');

function ThemeProbe() {
  const theme = useTheme();
  return <span data-testid="theme" data-mode={theme.palette.mode} data-dir={theme.direction} />;
}

describe('MUI UiProvider', () => {
  it('keeps class names apart per scope and flips layout in RTL', () => {
    render(
      <>
        <UiProvider locale="en" direction="ltr" colorScheme="light" scope="pf">
          <Box data-testid="ltr" sx={{ marginLeft: '3px' }} />
        </UiProvider>
        <UiProvider locale="ar" direction="rtl" colorScheme="light" scope="pf">
          <Box data-testid="rtl" sx={{ marginLeft: '5px' }} />
        </UiProvider>
      </>,
    );
    expect(screen.getByTestId('ltr').className).toMatch(/(^|\s)pf-(?!rtl-)/);
    expect(screen.getByTestId('rtl').className).toMatch(/(^|\s)pf-rtl-/);
    expect(stylesFor('pf')).toContain('margin-left:3px');
    expect(stylesFor('pf-rtl')).toContain('margin-right:5px');
    expect(stylesFor('pf-rtl')).not.toContain('margin-left:5px');
  });

  it('uses the default scope when none is given', () => {
    render(
      <UiProvider locale="en" direction="ltr" colorScheme="light">
        <Box data-testid="box" sx={{ marginTop: '1px' }} />
      </UiProvider>,
    );
    expect(screen.getByTestId('box').className).toMatch(/(^|\s)ui-/);
  });

  it('hands its direction and color scheme to the MUI theme', () => {
    render(
      <UiProvider locale="ar" direction="rtl" colorScheme="dark">
        <ThemeProbe />
      </UiProvider>,
    );
    const probe = screen.getByTestId('theme');
    expect(probe).toHaveAttribute('data-mode', 'dark');
    expect(probe).toHaveAttribute('data-dir', 'rtl');
    expect(screen.getByTestId('ui-root')).toHaveStyle({ color: palette.dark.foreground });
  });
});
