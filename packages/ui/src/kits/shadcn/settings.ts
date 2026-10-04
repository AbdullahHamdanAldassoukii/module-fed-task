import { createContext, useContext } from 'react';
import type { UiProviderProps } from '../../api';

export type UiSettings = Pick<UiProviderProps, 'direction' | 'colorScheme'>;

export const UiSettingsContext = createContext<UiSettings>({
  direction: 'ltr',
  colorScheme: 'light',
});
export const useUiSettings = () => useContext(UiSettingsContext);
