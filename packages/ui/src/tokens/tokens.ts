export const radius = '0.5rem';

export const spacing = '0.25rem';

export const fontFamily =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Arabic", "Helvetica Neue", Arial, sans-serif';

export const palette = {
  light: {
    background: '#ffffff',
    foreground: '#0a0a0a',
    card: '#ffffff',
    cardForeground: '#0a0a0a',
    popover: '#ffffff',
    popoverForeground: '#0a0a0a',
    primary: '#2563eb',
    primaryForeground: '#ffffff',
    secondary: '#f4f4f5',
    secondaryForeground: '#18181b',
    muted: '#f4f4f5',
    mutedForeground: '#52525b',
    accent: '#eff6ff',
    accentForeground: '#1e3a8a',
    destructive: '#dc2626',
    destructiveForeground: '#ffffff',
    success: '#15803d',
    successForeground: '#ffffff',
    warning: '#b45309',
    warningForeground: '#ffffff',
    border: '#e4e4e7',
    input: '#d4d4d8',
    ring: '#2563eb',
  },
  dark: {
    background: '#09090b',
    foreground: '#fafafa',
    card: '#18181b',
    cardForeground: '#fafafa',
    popover: '#18181b',
    popoverForeground: '#fafafa',
    primary: '#60a5fa',
    primaryForeground: '#0a0a0a',
    secondary: '#27272a',
    secondaryForeground: '#fafafa',
    muted: '#27272a',
    mutedForeground: '#a1a1aa',
    accent: '#1e3a8a',
    accentForeground: '#dbeafe',
    destructive: '#f87171',
    destructiveForeground: '#0a0a0a',
    success: '#4ade80',
    successForeground: '#052e16',
    warning: '#fbbf24',
    warningForeground: '#451a03',
    border: '#27272a',
    input: '#3f3f46',
    ring: '#60a5fa',
  },
} as const;

export type PaletteToken = keyof typeof palette.light;
