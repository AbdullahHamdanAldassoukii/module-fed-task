import { Navigate, Outlet, type RouteObject } from 'react-router';
import { useSyncExternalStore } from 'react';
import { AppHeader } from '../components/AppHeader';
import { useServices } from '../hooks/useServices';
import { M, useT } from '../lib/i18n';
import { devPanel } from './devPanel/devPanelStore';
import { NotFoundPage } from './NotFoundPage';
import { RouteErrorPage } from './RouteErrorPage';

function Shell() {
  const { config } = useServices();
  const { t } = useT();
  const isDevPanelOpen = useSyncExternalStore(
    devPanel.subscribe,
    devPanel.getSnapshot,
    devPanel.getSnapshot,
  );

  return (
    <>
      <a
        className="host-skip-link"
        href="#main"
        style={{ insetInlineStart: 8, position: 'absolute', top: 8 }}
      >
        {t(M.app.skipToContent)}
      </a>
      <AppHeader
        isDevPanelOpen={isDevPanelOpen}
        onOpenDevPanel={config.features.devPanel ? devPanel.open : undefined}
      />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}

function HydrateFallback() {
  const { t } = useT();

  return <div role="status">{t(M.app.loading)}</div>;
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Shell />,
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <HydrateFallback />,
    children: [
      { index: true, element: <Navigate replace to="/onboarding/passport" /> },
      {
        path: 'onboarding',
        lazy: async () => ({
          Component: (await import('../features/onboarding/routes/OnboardingLayout'))
            .OnboardingLayout,
        }),
        children: [
          { index: true, element: <Navigate replace to="passport" /> },
          {
            path: 'passport',
            handle: { wizardPage: 'passport' },
            lazy: async () => ({
              Component: (await import('../features/onboarding/routes/PassportStep')).PassportStep,
            }),
          },
          {
            path: 'id-info',
            handle: { wizardPage: 'idInfo' },
            lazy: async () => ({
              Component: (await import('../features/onboarding/routes/IdInfoStep')).IdInfoStep,
            }),
          },
          {
            path: 'submitted',
            handle: { wizardPage: 'submitted' },
            lazy: async () => ({
              Component: (await import('../features/onboarding/routes/SubmittedPage'))
                .SubmittedPage,
            }),
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
