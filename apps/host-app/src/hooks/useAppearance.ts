import { useContext } from 'react';
import { AppearanceContext, type Appearance } from './appearanceContext';

export function useAppearance(): Appearance {
  const appearance = useContext(AppearanceContext);
  if (!appearance) throw new Error('useAppearance must be used inside <AppearanceProvider>');
  return appearance;
}
