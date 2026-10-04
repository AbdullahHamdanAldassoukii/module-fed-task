import { useCallback } from 'react';
import { useLocation, useMatches, useNavigate } from 'react-router';
import {
  isWizardPageId,
  onboardingSteps,
  wizardPagePath,
  wizardPages,
  type StepId,
  type WizardPageId,
} from '../model';

function pageIdFromHandle(handle: unknown): WizardPageId | undefined {
  if (typeof handle !== 'object' || handle === null || !('wizardPage' in handle)) return undefined;
  const pageId = (handle as Record<string, unknown>).wizardPage;
  return isWizardPageId(pageId) ? pageId : undefined;
}

function hasPreviousWizardStep(value: unknown): value is { wizardPreviousStep: StepId } {
  if (typeof value !== 'object' || value === null || !('wizardPreviousStep' in value)) {
    return false;
  }
  return onboardingSteps.some(
    (step) => step.id === (value as Record<string, unknown>).wizardPreviousStep,
  );
}

export function useWizardNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const pageId = useMatches()
    .map((match) => pageIdFromHandle(match.handle))
    .find((id) => id !== undefined);
  const currentPage = wizardPages.find((page) => page.id === pageId) ?? wizardPages[0];
  const stepPosition = onboardingSteps.findIndex((step) => step.id === currentPage.id);
  const next = stepPosition === -1 ? undefined : onboardingSteps[stepPosition + 1];
  const previous = stepPosition === -1 ? undefined : onboardingSteps[stepPosition - 1];

  const goTo = useCallback(
    (id: WizardPageId, options: { replace?: boolean } = {}) => {
      const page = wizardPages.find((candidate) => candidate.id === id);
      if (page) void navigate(wizardPagePath(page), options);
    },
    [navigate],
  );

  const goNext = useCallback(() => {
    if (next) {
      void navigate(wizardPagePath(next), {
        state: { wizardPreviousStep: currentPage.id },
      });
    }
  }, [currentPage.id, navigate, next]);

  const goBack = useCallback(() => {
    if (!previous) return;

    if (
      hasPreviousWizardStep(location.state) &&
      location.state.wizardPreviousStep === previous.id
    ) {
      void navigate(-1);
      return;
    }

    void navigate(wizardPagePath(previous), { replace: true });
  }, [location.state, navigate, previous]);

  return {
    currentPage,
    goNext,
    goBack,
    goTo,
  };
}
