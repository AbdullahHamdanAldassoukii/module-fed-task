import { useEffect, useRef } from 'react';
import { Navigate, Outlet } from 'react-router';
import { M, useT } from '../../../lib/i18n';
import { WizardStepper } from '../components/WizardStepper';
import { PAGE_TITLE } from '../components/stepLabels';
import { WizardProvider, useOnboardingWizard } from '../hooks/useOnboardingWizard';
import { useWizardNavigation } from '../hooks/useWizardNavigation';
import { wizardPagePath, wizardPages } from '../model';

function Frame() {
  const { t } = useT();
  const { currentPage } = useWizardNavigation();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const title = t(PAGE_TITLE[currentPage.id]);

  useEffect(() => {
    document.title = `${title} · ${t(M.app.title)}`;
  }, [title, t]);

  // Focus follows the page, not the language: a language switch keeps focus where it is.
  useEffect(() => {
    headingRef.current?.focus();
  }, [currentPage.id]);

  return (
    <div className="wizard">
      <WizardStepper currentId={currentPage.id} />
      <h1 className="wizard-heading" ref={headingRef} tabIndex={-1}>
        {title}
      </h1>
      <Outlet />
    </div>
  );
}

function GuardedFrame() {
  const { state } = useOnboardingWizard();
  const { currentPage } = useWizardNavigation();

  if (!currentPage.canEnter(state)) {
    const enterable = wizardPages.find((page) => page.canEnter(state));
    if (enterable) return <Navigate replace to={wizardPagePath(enterable)} />;
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
