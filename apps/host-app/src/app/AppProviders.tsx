import { I18nProvider, type I18nInstance } from '@repo/i18n';
import { Toaster, UiGlobalStyles, UiProvider } from '@repo/ui';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AppErrorBoundary } from '../components/AppErrorBoundary';
import { useAppearance } from '../hooks/useAppearance';
import { AppearanceProvider } from './AppearanceProvider';
import { ServicesProvider } from './ServicesProvider';
import type { Services } from './createServices';

function KitProviders({ children }: { children: ReactNode }) {
  const { locale, direction, colorScheme } = useAppearance();
  return (
    <UiProvider locale={locale} direction={direction} colorScheme={colorScheme} scope="host">
      <UiGlobalStyles />
      {children}
      <Toaster />
    </UiProvider>
  );
}

export function createQueryClient(services: Services) {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        services.logger.error('query.failed', { key: query.queryKey, error });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        services.logger.error('mutation.failed', { key: mutation.options.mutationKey, error });
      },
    }),
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false, networkMode: 'online' },
    },
  });
}

export function AppProviders({
  services,
  i18n,
  queryClient,
  children,
}: {
  services: Services;
  i18n: I18nInstance;
  queryClient: QueryClient;
  children: ReactNode;
}) {
  return (
    <AppErrorBoundary logger={services.logger}>
      <ServicesProvider services={services}>
        <I18nProvider i18n={i18n}>
          <AppearanceProvider i18n={i18n} storage={services.localStorage}>
            <KitProviders>
              <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            </KitProviders>
          </AppearanceProvider>
        </I18nProvider>
      </ServicesProvider>
    </AppErrorBoundary>
  );
}
