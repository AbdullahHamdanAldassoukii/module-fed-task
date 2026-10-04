import type { WizardState } from './wizardState';

export type StepId = 'passport' | 'idInfo';

export interface WizardStep {
  id: StepId;
  path: string;
  canEnter: (state: WizardState) => boolean;
}

export const onboardingSteps: readonly [WizardStep, WizardStep] = [
  { id: 'passport', path: 'passport', canEnter: () => true },
  {
    id: 'idInfo',
    path: 'id-info',
    canEnter: (state) => state.passport.valid,
  },
];

export const stepIndex = (id: StepId) => onboardingSteps.findIndex((step) => step.id === id);

export function stepStatuses(currentId: StepId) {
  const current = stepIndex(currentId);
  return onboardingSteps.map((step, index) => ({
    ...step,
    status:
      index < current
        ? ('complete' as const)
        : index === current
          ? ('current' as const)
          : ('upcoming' as const),
  }));
}
