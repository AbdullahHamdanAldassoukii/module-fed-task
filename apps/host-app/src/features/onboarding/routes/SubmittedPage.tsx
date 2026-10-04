import { Alert, AlertDialog, Button } from '@repo/ui';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppearance } from '../../../hooks/useAppearance';
import { copyText } from '../../../lib/clipboard';
import { M, useT } from '../../../lib/i18n';
import { notify } from '../../../lib/notify';
import { PayloadViewer } from '../components/PayloadViewer';
import { SummaryList } from '../components/SummaryList';
import { useOnboardingWizard } from '../hooks/useOnboardingWizard';
import { onboardingSteps, wizardPagePath } from '../model';

function formatTimestamp(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    numberingSystem: 'latn',
  }).format(date);
}

/** The wizard's end state. Its heading and stepper come from the layout. */
export function SubmittedPage() {
  const { t } = useT();
  const { locale } = useAppearance();
  const navigate = useNavigate();
  const { state, startOver } = useOnboardingWizard();
  const [confirming, setConfirming] = useState(false);
  const { submission } = state;

  // Without a submission the layout's guard is already sending the user to Step 1.
  if (submission.status !== 'succeeded') return null;

  const { referenceId, submittedAt, summary, payload } = submission;

  const copyReference = async () => {
    const copied = await copyText(referenceId);
    notify(t(copied ? M.common.copied : M.common.copyFailed), {
      tone: copied ? 'success' : 'error',
    });
  };

  return (
    <div className="wizard-section">
      <Alert title={t(M.submitted.received)} tone="success">
        {t(M.submitted.keepReference)}
      </Alert>

      <section aria-label={t(M.submitted.reference)} className="wizard-card">
        <dl className="wizard-receipt">
          <div className="wizard-receipt-item">
            <dt>{t(M.submitted.reference)}</dt>
            <dd className="wizard-reference-row">
              <bdi className="wizard-reference" dir="ltr">
                {referenceId}
              </bdi>
              <Button
                aria-label={t(M.submitted.copyReference)}
                size="sm"
                variant="secondary"
                onClick={() => void copyReference()}
              >
                {t(M.submitted.copy)}
              </Button>
            </dd>
          </div>
          <div className="wizard-receipt-item">
            <dt>{t(M.submitted.submittedAt)}</dt>
            <dd>
              <time dateTime={submittedAt}>{formatTimestamp(submittedAt, locale)}</time>
            </dd>
          </div>
        </dl>
      </section>

      {summary ? (
        <section aria-labelledby="summary-title" className="wizard-card">
          <header className="wizard-card-header">
            <h2 className="wizard-card-title" id="summary-title">
              {t(M.submitted.summaryTitle)}
            </h2>
          </header>
          <SummaryList locale={locale} summary={summary} />
        </section>
      ) : (
        <Alert tone="info">{t(M.submitted.privacyNote)}</Alert>
      )}

      {payload ? (
        <PayloadViewer
          fileName={`application-${referenceId}.json`}
          payload={payload}
          title={t(M.payload.submittedTitle)}
        />
      ) : null}

      <div className="wizard-actions">
        <div className="wizard-actions-end">
          <Button onClick={() => setConfirming(true)}>{t(M.submitted.startNew)}</Button>
        </div>
      </div>

      <AlertDialog
        cancelLabel={t(M.submitted.confirmCancel)}
        confirmLabel={t(M.submitted.confirmStart)}
        description={t(M.submitted.confirmBody, { referenceId })}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          startOver();
          void navigate(wizardPagePath(onboardingSteps[0]), { replace: true });
        }}
        open={confirming}
        title={t(M.submitted.confirmTitle)}
      />
    </div>
  );
}
