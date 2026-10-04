import type { ReactNode } from 'react';
import { ServicesContext } from '../hooks/useServices';
import type { Services } from './createServices';

export function ServicesProvider({
  services,
  children,
}: {
  services: Services;
  children: ReactNode;
}) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}
