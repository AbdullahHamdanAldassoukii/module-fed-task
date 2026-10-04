import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { EMPTY_PASSPORT_DRAFT, type PassportFormState } from '@repo/passport-contract';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useState } from 'react';
import {
  RouterProvider,
  createMemoryRouter,
  type NonIndexRouteObject,
  type RouteObject,
} from 'react-router';
import { AppProviders, createQueryClient } from './AppProviders';
import type { Services } from './createServices';
import { createAppI18n } from '../lib/i18n';
import { fakeServices } from '../testing/fakes';
import { useOnboardingWizard } from '../features/onboarding/hooks/useOnboardingWizard';
import { PassportStep } from '../features/onboarding/routes/PassportStep';
import { routes } from './router';
import { RouteErrorPage } from './RouteErrorPage';
import { noopLogger } from '../lib/logger';

const activeRouters: ReturnType<typeof createMemoryRouter>[] = [];

afterEach(() => {
  activeRouters.splice(0).forEach((router) => router.dispose());
});

function renderRoutes(routeObjects: RouteObject[], initialEntry: string, services?: Services) {
  const testServices = services ?? fakeServices();
  const router = createMemoryRouter(routeObjects, { initialEntries: [initialEntry] });
  activeRouters.push(router);

  return {
    router,
    ...render(
      <AppProviders
        i18n={createAppI18n('en')}
        queryClient={createQueryClient(testServices)}
        services={testServices}
      >
        <RouterProvider router={router} />
      </AppProviders>,
    ),
  };
}

const validPassport: PassportFormState = {
  valid: true,
  data: {
    ...EMPTY_PASSPORT_DRAFT,
    document: { base64: 'QQ==', fileName: 'passport.pdf', mimeType: 'application/pdf' },
    expiryDate: '2034-01-14',
    firstName: 'Ali',
    issueDate: '2024-01-15',
    lastName: 'Hassan',
    passportNumber: 'A123',
  },
};

function SeedPassport() {
  const { dispatch, state } = useOnboardingWizard();

  useEffect(() => {
    dispatch({ type: 'passportChanged', state: validPassport });
  }, [dispatch]);

  return <output data-testid="passport-first-name">{state.passport.data.firstName}</output>;
}

function SeededPassportStep() {
  return (
    <>
      <SeedPassport />
      <PassportStep />
    </>
  );
}

function RerenderingRouteError() {
  const [render, setRender] = useState(0);

  return (
    <>
      <button type="button" onClick={() => setRender((current) => current + 1)}>
        Rerender route error {render}
      </button>
      <RouteErrorPage />
    </>
  );
}

function routesWithSeededPassport(): RouteObject[] {
  const root = routes[0]! as NonIndexRouteObject;
  return [
    {
      ...root,
      children: root.children?.map((route) => {
        if (route.path !== 'onboarding' || !route.children) return route;
        const onboarding = route;
        return {
          ...onboarding,
          children: onboarding.children?.map((child) =>
            child.path === 'passport'
              ? { ...child, lazy: async () => ({ Component: SeededPassportStep }) }
              : child,
          ),
        };
      }),
    },
  ];
}

describe('host routes', () => {
  it('redirects the root and onboarding index to the passport step', async () => {
    const root = renderRoutes(routes, '/');
    await waitFor(() => expect(root.router.state.location.pathname).toBe('/onboarding/passport'));

    const onboarding = renderRoutes(routes, '/onboarding');
    await waitFor(() =>
      expect(onboarding.router.state.location.pathname).toBe('/onboarding/passport'),
    );
  });

  it('renders the not-found page for an unmatched path', async () => {
    renderRoutes(routes, '/missing');

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(document.title).toBe('Page not found · Passport Wizard');
  });

  it('uses the root error element when a lazy route fails', async () => {
    const root = routes[0]! as NonIndexRouteObject;
    const user = userEvent.setup();
    const logger = { ...noopLogger, error: rs.fn() };
    const failingRoutes: RouteObject[] = [
      {
        ...root,
        errorElement: <RerenderingRouteError />,
        children: [
          ...(root.children ?? []),
          {
            path: 'broken',
            lazy: async () => {
              throw new Error('broken route');
            },
          },
        ],
      },
    ];

    renderRoutes(failingRoutes, '/broken', fakeServices({ logger }));

    expect(
      await screen.findByRole('heading', { name: 'Something went wrong' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Rerender route error 0' }));
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText('Something went wrong')).toHaveLength(1);
    expect(document.title).toBe('Something went wrong · Passport Wizard');
  });

  it('keeps wizard state while Next and Back use the step URLs', async () => {
    const user = userEvent.setup();
    const { router } = renderRoutes(routesWithSeededPassport(), '/onboarding/passport');

    const next = await screen.findByRole('button', { name: 'Next' });
    await waitFor(() => expect(next).toBeEnabled());
    await user.click(next);

    expect(await screen.findByRole('heading', { name: 'ID info' })).toHaveFocus();
    expect(document.title).toBe('ID info · Passport Wizard');
    expect(router.state.location.pathname).toBe('/onboarding/id-info');

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByRole('heading', { name: 'Passport' })).toHaveFocus();
    expect(await screen.findByTestId('passport-first-name')).toHaveTextContent('Ali');
    expect(router.state.location.pathname).toBe('/onboarding/passport');

    await act(async () => {
      await router.navigate(1);
    });
    expect(await screen.findByRole('heading', { name: 'ID info' })).toBeInTheDocument();
  });
});
