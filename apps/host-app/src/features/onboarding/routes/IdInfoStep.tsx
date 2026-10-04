import { Button, VisuallyHidden } from '@repo/ui';
import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAppearance } from '../../../hooks/useAppearance';
import { ValidationError } from '../../../lib/errors';
import { M, useT } from '../../../lib/i18n';
import { IdInfoForm } from '../components/IdInfoForm';
import { SubmissionErrorAlert } from '../components/SubmissionErrorAlert';
import { useIdInfoForm } from '../hooks/useIdInfoForm';
import { useOnboardingWizard } from '../hooks/useOnboardingWizard';
import { useSubmitApplication } from '../hooks/useSubmitApplication';
import { useWizardNavigation } from '../hooks/useWizardNavigation';
import {
  onboardingSteps,
  rejectedFields,
  submittedPage,
  wizardPagePath,
  type IdInfoDraft,
} from '../model';

const SUBMIT_HINT_ID = 'submit-hint';
const [passportStep] = onboardingSteps;

export function IdInfoStep() {
  const { t } = useT();
  const { locale } = useAppearance();
  const navigate = useNavigate();
  const { state, dispatch, requestPassportFocus } = useOnboardingWizard();
  const { goBack, goTo } = useWizardNavigation();
  const { submission } = state;
  const isSubmitting = submission.status === 'submitting';

  const onValuesChange = useCallback(
    (values: IdInfoDraft) => dispatch({ type: 'idInfoChanged', values }),
    [dispatch],
  );
  const { fields, showServerErrors } = useIdInfoForm({
    values: state.idInfo.values,
    onValuesChange,
  });
  const onSucceeded = useCallback(() => {
    void navigate(wizardPagePath(submittedPage), { replace: true });
  }, [navigate]);
  const { canSubmit, submit, cancel, isWaitingForNetwork } = useSubmitApplication({
    onSucceeded,
  });

  const alertRef = useRef<HTMLDivElement>(null);
  const failure = submission.status === 'failed' ? submission : null;
  const failedError = failure?.error ?? null;

  // A rejected ID field takes focus; any other failure focuses the alert and its actions.
  useEffect(() => {
    if (!failedError) return;
    if (
      failedError instanceof ValidationError &&
      showServerErrors(rejectedFields(failedError.fieldErrors).idInfo)
    ) {
      return;
    }
    alertRef.current?.focus();
  }, [failedError, showServerErrors]);

  useEffect(() => {
    if (isWaitingForNetwork) alertRef.current?.focus();
  }, [isWaitingForNetwork]);

  const showHint = !canSubmit && !isSubmitting;

  return (
    <form
      aria-busy={isSubmitting}
      className="wizard-section"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <section aria-labelledby="id-info-title" className="wizard-card">
        <header className="wizard-card-header">
          <h2 className="wizard-card-title" id="id-info-title">
            {t(M.idInfo.title)}
          </h2>
          <p className="wizard-card-description">{t(M.idInfo.description)}</p>
        </header>
        <IdInfoForm disabled={isSubmitting} fields={fields} locale={locale} />
      </section>

      <SubmissionErrorAlert
        failure={failure}
        focusRef={alertRef}
        onCancel={cancel}
        onOpenPassportStep={(field) => {
          requestPassportFocus(field ?? 'firstField');
          goTo(passportStep.id);
        }}
        onRetry={submit}
        passportStepHref={wizardPagePath(passportStep)}
        waitingForNetwork={isSubmitting && isWaitingForNetwork}
      />

      <div className="wizard-actions">
        <Button disabled={isSubmitting} variant="secondary" onClick={goBack}>
          {t(M.wizard.back)}
        </Button>
        <div className="wizard-actions-end">
          {showHint ? (
            <p className="wizard-hint" id={SUBMIT_HINT_ID}>
              {t(M.wizard.submitHint)}
            </p>
          ) : null}
          <Button
            aria-describedby={showHint ? SUBMIT_HINT_ID : undefined}
            disabled={!canSubmit}
            loading={isSubmitting}
            type="submit"
          >
            {t(isSubmitting ? M.wizard.submitting : M.wizard.submit)}
          </Button>
        </div>
      </div>
      <VisuallyHidden>
        <span role="status">{isSubmitting ? t(M.wizard.submitting) : ''}</span>
      </VisuallyHidden>
    </form>
  );
}
