import { useEffect, useRef } from 'react';
import { Navigate, Outlet } from 'react-router';
import { M, useT } from '../../../lib/i18n';
import { WizardStepper } from '../components/WizardStepper';
import { STEP_TITLE } from '../components/stepLabels';
import { WizardProvider, useOnboardingWizard } from '../hooks/useOnboardingWizard';
import { useWizardNavigation } from '../hooks/useWizardNavigation';
import { onboardingSteps } from '../model';

function Frame() {
  const { t } = useT();
  const { currentStep } = useWizardNavigation();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = `${t(STEP_TITLE[currentStep.id])} · ${t(M.app.title)}`;
  }, [currentStep.id, t]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [currentStep.id]);

  return (
    <div style={{ display: 'grid', gap: 16, margin: '0 auto', maxWidth: 720, padding: 16 }}>
      <WizardStepper currentId={currentStep.id} />
      <h1 ref={headingRef} tabIndex={-1} style={{ fontSize: 24, fontWeight: 600, outline: 'none' }}>
        {t(STEP_TITLE[currentStep.id])}
      </h1>
      <Outlet />
    </div>
  );
}

function GuardedFrame() {
  const { state } = useOnboardingWizard();
  const { currentStep } = useWizardNavigation();

  if (!currentStep.canEnter(state)) {
    const firstEnterableStep = onboardingSteps.find((step) => step.canEnter(state));
    if (firstEnterableStep) {
      return <Navigate replace to={`/onboarding/${firstEnterableStep.path}`} />;
    }
  }

  return <Frame />;
}

export function OnboardingLayout() {
  return (
    <WizardProvider>
      <GuardedFrame />
    </WizardProvider>
  );
}
