import { describe, expect, it } from '@rstest/core';
import { initialWizardState, wizardReducer } from './wizardState';

describe('wizardReducer', () => {
  it('stores passport state and resets', () => {
    const next = wizardReducer(initialWizardState, {
      type: 'passportChanged',
      state: {
        valid: false,
        data: { ...initialWizardState.passport.data, firstName: 'Ali' },
      },
    });

    expect(next.passport.data.firstName).toBe('Ali');
    expect(wizardReducer(next, { type: 'reset' })).toEqual(initialWizardState);
  });

  it('returns the same reference when nothing changed', () => {
    const same = wizardReducer(initialWizardState, {
      type: 'passportChanged',
      state: initialWizardState.passport,
    });

    expect(same).toBe(initialWizardState);
  });

  it('stores a replacement document when its content changes', () => {
    const document = {
      fileName: 'passport.pdf',
      mimeType: 'application/pdf' as const,
      base64: 'A',
    };
    const current = wizardReducer(initialWizardState, {
      type: 'passportChanged',
      state: { valid: false, data: { ...initialWizardState.passport.data, document } },
    });
    const next = wizardReducer(current, {
      type: 'passportChanged',
      state: {
        valid: false,
        data: {
          ...current.passport.data,
          document: { ...document, base64: 'B' },
        },
      },
    });

    expect(next).not.toBe(current);
    expect(next.passport.data.document?.base64).toBe('B');
  });

  it('returns the same state for the identical document reference', () => {
    const document = {
      fileName: 'passport.pdf',
      mimeType: 'application/pdf' as const,
      base64: 'A',
    };
    const current = wizardReducer(initialWizardState, {
      type: 'passportChanged',
      state: { valid: false, data: { ...initialWizardState.passport.data, document } },
    });
    const next = wizardReducer(current, {
      type: 'passportChanged',
      state: { valid: false, data: { ...current.passport.data, document } },
    });

    expect(next).toBe(current);
  });
});
