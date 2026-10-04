import { useCallback } from 'react';
import { useLocation, useMatches, useNavigate } from 'react-router';
import { onboardingSteps, stepIndex, type StepId } from '../model';

function isStepId(value: unknown): value is StepId {
  return value === 'passport' || value === 'idInfo';
}

function stepIdFromHandle(handle: unknown): StepId | undefined {
  if (typeof handle !== 'object' || handle === null || !('stepId' in handle)) return undefined;
  const stepId = (handle as Record<string, unknown>).stepId;
  return isStepId(stepId) ? stepId : undefined;
}

function hasPreviousWizardStep(value: unknown): value is { wizardPreviousStep: StepId } {
  if (typeof value !== 'object' || value === null || !('wizardPreviousStep' in value)) {
    return false;
  }
  return isStepId((value as Record<string, unknown>).wizardPreviousStep);
}

export function useWizardNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const stepId = useMatches()
    .map((match) => stepIdFromHandle(match.handle))
    .find(isStepId);
  const currentStep = onboardingSteps.find((step) => step.id === stepId) ?? onboardingSteps[0];
  const goTo = useCallback(
    (id: StepId) => {
      const step = onboardingSteps[stepIndex(id)];
      if (step) void navigate(`/onboarding/${step.path}`);
    },
    [navigate],
  );
  const next = onboardingSteps[stepIndex(currentStep.id) + 1];
  const previous = onboardingSteps[stepIndex(currentStep.id) - 1];

  const goNext = useCallback(() => {
    if (next) {
      void navigate(`/onboarding/${next.path}`, {
        state: { wizardPreviousStep: currentStep.id },
      });
    }
  }, [currentStep.id, navigate, next]);

  const goBack = useCallback(() => {
    if (!previous) return;

    if (
      hasPreviousWizardStep(location.state) &&
      location.state.wizardPreviousStep === previous.id
    ) {
      void navigate(-1);
      return;
    }

    void navigate(`/onboarding/${previous.path}`, { replace: true });
  }, [location.state, navigate, previous]);

  return {
    currentStep,
    goNext,
    goBack,
    goTo,
  };
}
