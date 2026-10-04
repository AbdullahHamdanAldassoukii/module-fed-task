import { createTheme, type Theme } from '@mui/material/styles';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import type { ColorScheme, Direction } from '../../api';
import { fontFamily, palette, radius, spacing } from '../../tokens/tokens';

const COARSE_POINTER = '@media (pointer: coarse)';
const TOUCH_TARGET = 44;

const ROOT_FONT_SIZE = 16;
const themes = new Map<string, Theme>();

export function getTheme(direction: Direction, colorScheme: ColorScheme): Theme {
  const key = `${direction}-${colorScheme}`;
  let theme = themes.get(key);
  if (!theme) {
    const t = palette[colorScheme];
    theme = createTheme({
      direction,
      palette: {
        mode: colorScheme,
        primary: { main: t.primary, contrastText: t.primaryForeground },
        secondary: { main: t.secondaryForeground, contrastText: t.secondary },
        error: { main: t.destructive, contrastText: t.destructiveForeground },
        success: { main: t.success, contrastText: t.successForeground },
        warning: { main: t.warning, contrastText: t.warningForeground },
        info: { main: t.primary, contrastText: t.primaryForeground },
        background: { default: t.background, paper: t.popover },
        text: { primary: t.foreground, secondary: t.mutedForeground },
        divider: t.border,
      },
      shape: { borderRadius: parseFloat(radius) * ROOT_FONT_SIZE },
      spacing: parseFloat(spacing) * ROOT_FONT_SIZE * 2,
      breakpoints: { values: { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 } },
      typography: { fontFamily, button: { textTransform: 'none', fontWeight: 600 } },
      components: {
        MuiButton: {
          defaultProps: { disableElevation: true },
          styleOverrides: { root: { [COARSE_POINTER]: { minHeight: TOUCH_TARGET } } },
        },
        MuiIconButton: {
          styleOverrides: {
            root: { [COARSE_POINTER]: { minHeight: TOUCH_TARGET, minWidth: TOUCH_TARGET } },
          },
        },
        MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
        MuiPopover: { styleOverrides: { paper: { border: `1px solid ${t.border}` } } },
        MuiDialog: { styleOverrides: { paper: { border: `1px solid ${t.border}` } } },
        MuiPickerPopper: { styleOverrides: { paper: { border: `1px solid ${t.border}` } } },
        MuiOutlinedInput: {
          styleOverrides: {
            root: { [COARSE_POINTER]: { minHeight: TOUCH_TARGET } },
            notchedOutline: { borderColor: t.input },
          },
        },
        MuiPickersOutlinedInput: {
          styleOverrides: {
            root: { [COARSE_POINTER]: { minHeight: TOUCH_TARGET } },
            notchedOutline: { borderColor: t.input },
          },
        },
      },
    });
    themes.set(key, theme);
  }
  return theme;
}
