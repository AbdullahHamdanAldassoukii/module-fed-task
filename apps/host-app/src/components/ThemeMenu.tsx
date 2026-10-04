import { DropdownMenu } from '@repo/ui';
import { useAppearance } from '../hooks/useAppearance';
import type { ThemePreference } from '../hooks/appearanceContext';
import { M, type AppMessageKey, useT } from '../lib/i18n';

const preferences: ThemePreference[] = ['light', 'dark', 'system'];
const THEME_LABEL = {
  light: M.theme.light,
  dark: M.theme.dark,
  system: M.theme.system,
} satisfies Record<ThemePreference, AppMessageKey>;

export function ThemeMenu() {
  const { t } = useT();
  const { themePreference, setThemePreference } = useAppearance();
  const currentName = t(THEME_LABEL[themePreference]);

  return (
    <DropdownMenu
      ariaLabel={`${t(M.header.theme)}: ${currentName}`}
      triggerLabel={currentName}
      items={preferences.map((preference) => ({
        id: preference,
        label: t(THEME_LABEL[preference]),
        selected: preference === themePreference,
        onSelect: () => setThemePreference(preference),
      }))}
    />
  );
}
