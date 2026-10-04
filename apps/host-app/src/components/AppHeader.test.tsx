import { describe, expect, it } from '@rstest/core';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { renderWithProviders } from '../testing/renderWithProviders';

describe('AppHeader', () => {
  it('persists Arabic and updates the document language and direction', async () => {
    const { services } = renderWithProviders(<AppHeader />);

    await userEvent.click(screen.getByRole('button', { name: 'Language: English' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'العربية' }));

    expect(document.documentElement).toHaveAttribute('lang', 'ar');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('button', { name: 'اللغة: العربية' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'التفضيلات' })).toBeInTheDocument();
    expect(services.localStorage.get('appearance.locale', (raw) => raw as string)).toBe('ar');
  });

  it('applies dark mode from the theme menu', async () => {
    renderWithProviders(<AppHeader />);

    await userEvent.click(screen.getByRole('button', { name: 'Theme: System' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Dark' }));

    expect(document.documentElement).toHaveClass('dark');
  });

  it('supports a typed wrapper around rendered content', () => {
    renderWithProviders(<span>Wrapped content</span>, {
      wrapper: (children: ReactNode) => <div data-testid="test-wrapper">{children}</div>,
    });

    expect(screen.getByTestId('test-wrapper')).toHaveTextContent('Wrapped content');
  });

  it('shows the non-production environment badge', () => {
    renderWithProviders(<AppHeader />);

    expect(screen.getByTestId('env-badge')).toHaveTextContent('DEV');
  });
});
