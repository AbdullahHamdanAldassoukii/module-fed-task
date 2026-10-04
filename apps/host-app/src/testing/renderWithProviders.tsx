import type { Locale } from '@repo/i18n';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, RouterProvider, type DataRouter } from 'react-router';
import { AppProviders, createQueryClient } from '../app/AppProviders';
import type { Services } from '../app/createServices';
import { createAppI18n } from '../lib/i18n';
import { fakeServices } from './fakes';

export function renderWithProviders(
  ui: ReactElement,
  options: {
    services?: Partial<Services>;
    locale?: Locale;
    route?: string;
    router?: DataRouter;
    wrapper?: (children: ReactNode) => ReactElement;
  } & Omit<RenderOptions, 'wrapper'> = {},
) {
  const {
    services: overrides,
    locale = 'en',
    route = '/',
    router,
    wrapper,
    ...renderOptions
  } = options;
  const services = fakeServices(overrides);
  const i18n = createAppI18n(locale);
  const queryClient = createQueryClient(services);
  const children = wrapper ? wrapper(ui) : ui;

  return {
    ...render(
      <AppProviders services={services} i18n={i18n} queryClient={queryClient}>
        {router ? (
          <RouterProvider router={router} />
        ) : (
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        )}
      </AppProviders>,
      renderOptions,
    ),
    services,
    i18n,
    queryClient,
  };
}
