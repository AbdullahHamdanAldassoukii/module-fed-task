import { describe, expect, it, rs } from '@rstest/core';
import { render, screen, waitFor } from '@testing-library/react';
import { PASSPORT_FORM_CONTRACT_VERSION, type PassportFormModule } from '@repo/passport-contract';
import * as mod from './PassportForm';

const Form = mod.default;

describe('exposed PassportForm module', () => {
  it('satisfies the PassportFormModule shape and version', () => {
    const module: PassportFormModule = mod;

    expect(module.contractVersion).toBe(PASSPORT_FORM_CONTRACT_VERSION);
  });

  it('takes root direction, language and theme from props without changing the host document', () => {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';

    render(<Form locale="ar" colorScheme="dark" onChange={() => {}} />);

    const root = document.querySelector('[data-passport-form-root]')!;
    expect(root).toHaveAttribute('dir', 'rtl');
    expect(root).toHaveAttribute('lang', 'ar');
    expect(root).toHaveClass('dark');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('does not read browser storage while rendering', () => {
    const storageNames = ['localStorage', 'sessionStorage'] as const;
    const descriptors = new Map(
      storageNames.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
    );

    for (const name of storageNames) {
      Object.defineProperty(globalThis, name, {
        configurable: true,
        get: () => {
          throw new Error('storage must not be read');
        },
      });
    }

    try {
      render(<Form locale="en" colorScheme="light" onChange={() => {}} />);
      expect(screen.getByRole('heading', { name: 'Passport details' })).toBeInTheDocument();
    } finally {
      for (const name of storageNames) {
        const descriptor = descriptors.get(name);
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else Reflect.deleteProperty(globalThis, name);
      }
    }
  });

  it('reports the invalid empty draft once after mount', async () => {
    const onChange = rs.fn();

    render(<Form locale="en" colorScheme="light" onChange={onChange} />);

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange.mock.calls[0]?.[0]).toMatchObject({ valid: false });
  });

  it('falls back to English for an unknown locale', () => {
    render(<Form locale={'fr' as never} colorScheme="light" onChange={() => {}} />);

    expect(document.querySelector('[data-passport-form-root]')).toHaveAttribute('lang', 'en');
    expect(screen.getByRole('heading', { name: 'Passport details' })).toBeInTheDocument();
  });

  it('switches language when the locale prop changes', async () => {
    const { rerender } = render(<Form locale="en" colorScheme="light" onChange={() => {}} />);

    rerender(<Form locale="ar" colorScheme="light" onChange={() => {}} />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'بيانات جواز السفر' })).toBeInTheDocument(),
    );
  });
});
