import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useServices } from '../../../hooks/useServices';
import { M, useT } from '../../../lib/i18n';
import { WizardActionsSlot } from '../components/WizardActions';
import { WizardStepper } from '../components/WizardStepper';
import { PAGE_TITLE } from '../components/stepLabels';
import { WizardProvider, useOnboardingWizard } from '../hooks/useOnboardingWizard';
import { readPersistedWizard, usePersistedWizardDraft } from '../hooks/usePersistedWizardDraft';
import { useWizardNavigation } from '../hooks/useWizardNavigation';
import { wizardPagePath, wizardPages } from '../model';

function Frame() {
  const { t } = useT();
  const { currentPage } = useWizardNavigation();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [actionsSlot, setActionsSlot] = useState<HTMLDivElement | null>(null);
  const title = t(PAGE_TITLE[currentPage.id]);

  useEffect(() => {
    document.title = `${title} · ${t(M.app.title)}`;
  }, [title, t]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [currentPage.id]);

  return (
    <div className="wizard">
      <WizardStepper currentId={currentPage.id} />
      <div className="wizard-titlebar">
        <h1 className="wizard-heading" ref={headingRef} tabIndex={-1}>
          {title}
        </h1>
        <div className="wizard-titlebar-actions" ref={setActionsSlot} />
      </div>
      <WizardActionsSlot.Provider value={actionsSlot}>
        <Outlet />
      </WizardActionsSlot.Provider>
    </div>
  );
}

function GuardedFrame() {
  const { state } = useOnboardingWizard();
  const { currentPage } = useWizardNavigation();
  usePersistedWizardDraft();

  if (!currentPage.canEnter(state)) {
    const enterable = wizardPages.find((page) => page.canEnter(state));
    if (enterable) return <Navigate replace to={wizardPagePath(enterable)} />;
  }

  return <Frame />;
}

export function OnboardingLayout() {
  const { sessionStorage } = useServices();
  const [restored] = useState(() => readPersistedWizard(sessionStorage));

  return (
    <WizardProvider initialState={restored}>
      <GuardedFrame />
    </WizardProvider>
  );
}
