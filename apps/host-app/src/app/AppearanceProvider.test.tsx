import { describe, expect, it } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { useAppearance } from '../hooks/useAppearance';
import { createAppI18n } from '../lib/i18n';
import { noopLogger } from '../lib/logger';
import { createMemoryStorage, createWebStorage } from '../lib/storage';
import { AppearanceProvider, readInitialLocale, readInitialTheme } from './AppearanceProvider';

function Probe() {
  const appearance = useAppearance();
  return (
    <output>{`${appearance.locale}|${appearance.direction}|${appearance.colorScheme}`}</output>
  );
}

describe('AppearanceProvider', () => {
  it('sets RTL document metadata for Arabic and resolves system to a concrete scheme', () => {
    render(
      <AppearanceProvider i18n={createAppI18n('ar')} storage={createMemoryStorage()}>
        <Probe />
      </AppearanceProvider>,
    );

    expect(screen.getByRole('status')).toHaveTextContent(/^ar\|rtl\|(light|dark)$/);
    expect(document.documentElement).toHaveAttribute('lang', 'ar');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });

  it('uses defaults when local storage cannot be read', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('blocked');
      },
    });

    try {
      const storage = createWebStorage('local', noopLogger);
      expect(readInitialLocale(storage, 'en-US')).toBe('en');
      expect(readInitialLocale(storage, 'ar-AE')).toBe('ar');
      expect(readInitialTheme(storage)).toBe('system');
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original);
    }
  });
});
