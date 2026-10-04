import { afterEach, describe, expect, it } from '@rstest/core';
import { act, screen } from '@testing-library/react';
import { createMemoryRouter, type DataRouter, type RouteObject } from 'react-router';
import type { Services } from '../../../app/createServices';
import { noopLogger } from '../../../lib/logger';
import { createPassportFormLoader } from '../../../remotes/passport-form';
import { renderWithProviders } from '../../../testing/renderWithProviders';
import { IdInfoStep } from './IdInfoStep';
import { OnboardingLayout } from './OnboardingLayout';
import { PassportStep } from './PassportStep';

const routes: RouteObject[] = [
  {
    path: '/onboarding',
    element: <OnboardingLayout />,
    children: [
      { path: 'passport', element: <PassportStep />, handle: { stepId: 'passport' } },
      { path: 'id-info', element: <IdInfoStep />, handle: { stepId: 'idInfo' } },
    ],
  },
];

const activeRouters: DataRouter[] = [];

afterEach(() => {
  activeRouters.splice(0).forEach((router) => router.dispose());
});

function renderLayout(route: string, locale: 'en' | 'ar' = 'en', services?: Partial<Services>) {
  const router = createMemoryRouter(routes, { initialEntries: [route] });
  activeRouters.push(router);
  return renderWithProviders(<div />, { locale, router, services });
}

describe('OnboardingLayout', () => {
  it('renders the first step as current and focuses its heading', async () => {
    renderLayout('/onboarding/passport');

    expect(screen.getByRole('navigation', { name: 'Progress' })).toBeInTheDocument();
    const heading = await screen.findByRole('heading', { level: 1, name: /Passport/ });
    expect(heading).toHaveFocus();
    expect(document.title).toContain('Passport');
  });

  it('redirects ID info to passport when the passport is not valid', async () => {
    renderLayout('/onboarding/id-info');

    expect(await screen.findByRole('heading', { level: 1, name: /Passport/ })).toBeInTheDocument();
  });

  it('disables Next with an accessible hint until the form is valid', () => {
    renderLayout('/onboarding/passport');

    const next = screen.getByRole('button', { name: 'Next' });
    expect(next).toBeDisabled();
    expect(next).toHaveAccessibleDescription('Complete all fields to continue');
  });

  it('changes the title without moving focus when the language changes at runtime', async () => {
    const { i18n } = renderLayout('/onboarding/passport');
    const unrelatedButton = document.body.appendChild(document.createElement('button'));
    unrelatedButton.textContent = 'Unrelated control';
    unrelatedButton.focus();

    await act(async () => {
      await i18n.changeLanguage('ar');
    });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'جواز السفر' }),
    ).toBeInTheDocument();
    expect(unrelatedButton).toHaveFocus();
    expect(document.title).toBe('جواز السفر · معالج جواز السفر');
    unrelatedButton.remove();
  });

  it('shows the remote fallback and keeps Next disabled when the remote is down', async () => {
    const loader = createPassportFormLoader({
      manifestUrl: 'http://localhost:3001/mf-manifest.json',
      logger: noopLogger,
      importModule: async () => {
        throw new Error('remote is down');
      },
      reregister: () => undefined,
    });
    renderLayout('/onboarding/passport', 'en', { remotes: { passportForm: loader } });

    expect(await screen.findByRole('alert')).toHaveTextContent("The passport form couldn't load");
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
