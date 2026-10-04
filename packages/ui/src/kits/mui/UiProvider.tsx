import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material/styles';
import { useState } from 'react';
import type { UiProviderProps } from '../../api';
import { getEmotionCache } from './emotion';
import { PortalContainerContext } from './portal';
import { getTheme } from './theme';

export function UiProvider({
  locale,
  direction,
  colorScheme,
  scope = 'ui',
  children,
}: UiProviderProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const theme = getTheme(direction, colorScheme);
  return (
    <CacheProvider value={getEmotionCache(scope, direction)}>
      <ThemeProvider theme={theme}>
        <PortalContainerContext.Provider value={container}>
          <div
            ref={setContainer}
            data-testid="ui-root"
            data-ui-root=""
            dir={direction}
            lang={locale}
            className={colorScheme === 'dark' ? 'dark' : undefined}
            style={{ display: 'contents', color: theme.palette.text.primary }}
          >
            {children}
          </div>
        </PortalContainerContext.Provider>
      </ThemeProvider>
    </CacheProvider>
  );
}
