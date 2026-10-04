import { cn } from 'cn';
import { Direction as DirectionPrimitive } from 'radix-ui';
import { useMemo, useState } from 'react';
import type { UiProviderProps } from '../../api';
import { PortalContainerContext } from './portal';
import { UiSettingsContext } from './settings';

export function UiProvider({ locale, direction, colorScheme, children }: UiProviderProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const settings = useMemo(() => ({ direction, colorScheme }), [direction, colorScheme]);
  return (
    <DirectionPrimitive.DirectionProvider dir={direction}>
      <UiSettingsContext.Provider value={settings}>
        <PortalContainerContext.Provider value={container}>
          <div
            ref={setContainer}
            data-testid="ui-root"
            data-ui-root=""
            dir={direction}
            lang={locale}
            className={cn('contents text-foreground', colorScheme === 'dark' && 'dark')}
          >
            {children}
          </div>
        </PortalContainerContext.Provider>
      </UiSettingsContext.Provider>
    </DirectionPrimitive.DirectionProvider>
  );
}
