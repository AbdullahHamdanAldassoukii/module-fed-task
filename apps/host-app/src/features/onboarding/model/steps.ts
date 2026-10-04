import type { WizardState } from './wizardState';

export interface WizardPage {
  id: string;
  path: string;
  canEnter: (state: WizardState) => boolean;
}

const isOpen = (state: WizardState) => state.submission.status !== 'succeeded';

export const onboardingSteps = [
  { id: 'passport', path: 'passport', canEnter: isOpen },
  { id: 'idInfo', path: 'id-info', canEnter: (state) => isOpen(state) && state.passport.valid },
] as const satisfies readonly WizardPage[];

export const submittedPage = {
  id: 'submitted',
  path: 'submitted',
  canEnter: (state) => state.submission.status === 'succeeded',
} as const satisfies WizardPage;

export const wizardPages = [...onboardingSteps, submittedPage] as const;

export type StepId = (typeof onboardingSteps)[number]['id'];
export type WizardPageId = (typeof wizardPages)[number]['id'];

export const ONBOARDING_ROOT = '/onboarding';

export function wizardPagePath(page: Pick<WizardPage, 'path'>): string {
  return `${ONBOARDING_ROOT}/${page.path}`;
}

export function isWizardPageId(value: unknown): value is WizardPageId {
  return wizardPages.some((page) => page.id === value);
}

export const stepIndex = (id: StepId) => onboardingSteps.findIndex((step) => step.id === id);

export function stepStatuses(currentId: WizardPageId) {
  const current = wizardPages.findIndex((page) => page.id === currentId);
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
