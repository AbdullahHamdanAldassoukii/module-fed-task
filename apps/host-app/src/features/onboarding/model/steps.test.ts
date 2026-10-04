import { describe, expect, it } from '@rstest/core';
import { EMPTY_PASSPORT_DRAFT } from '@repo/passport-contract';
import { onboardingSteps, stepStatuses } from './steps';
import { initialWizardState, type WizardState } from './wizardState';

const validState: WizardState = {
  ...initialWizardState,
  passport: {
    valid: true,
    data: {
      passportNumber: 'A',
      firstName: 'B',
      lastName: 'C',
      issueDate: '2024-01-15',
      expiryDate: '2034-01-14',
      document: { fileName: 'p.pdf', mimeType: 'application/pdf', base64: 'QQ==' },
    },
  },
};

describe('onboardingSteps', () => {
  it('has exactly two steps in order with stable paths', () => {
    expect(onboardingSteps.map((step) => step.id)).toEqual(['passport', 'idInfo']);
    expect(onboardingSteps.map((step) => step.path)).toEqual(['passport', 'id-info']);
  });

  it('allows ID info only after a valid passport', () => {
    expect(onboardingSteps[1].canEnter(initialWizardState)).toBe(false);
    expect(onboardingSteps[1].canEnter(validState)).toBe(true);
    expect(onboardingSteps[0].canEnter(initialWizardState)).toBe(true);
  });

  it('derives stepper statuses from the current step', () => {
    expect(stepStatuses('idInfo').map((step) => step.status)).toEqual(['complete', 'current']);
    expect(stepStatuses('passport').map((step) => step.status)).toEqual(['current', 'upcoming']);
    expect(initialWizardState.passport.data).toEqual(EMPTY_PASSPORT_DRAFT);
  });
});
