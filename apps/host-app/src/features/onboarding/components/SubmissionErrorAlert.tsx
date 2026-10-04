import { Alert, Button } from '@repo/ui';
import { useState, type ReactNode, type Ref } from 'react';
import { errorPresentation, ValidationError, type AppError } from '../../../lib/errors';
import { M, useT } from '../../../lib/i18n';
import { rejectedFields, type ApplicationPayload, type PassportField } from '../model';
import { PayloadViewer } from './PayloadViewer';

export interface SubmissionFailure {
  error: AppError;
  payload: ApplicationPayload;
}

export function SubmissionErrorAlert({
  failure,
  waitingForNetwork,
  onRetry,
  onCancel,
  passportStepHref,
  onOpenPassportStep,
  focusRef,
}: {
  failure: SubmissionFailure | null;
  waitingForNetwork: boolean;
  onRetry: () => void;
  onCancel: () => void;
  passportStepHref: string;
  onOpenPassportStep: (field: PassportField | undefined) => void;
  focusRef: Ref<HTMLDivElement>;
}) {
  const { t } = useT();
  const [payloadOpen, setPayloadOpen] = useState(false);

  let content: ReactNode = null;
  let offersPayload = false;
  if (waitingForNetwork) {
    content = (
      <Alert
        actions={
          <Button size="sm" variant="secondary" onClick={onCancel}>
            {t(M.submission.cancel)}
          </Button>
        }
        role="alert"
        title={t(M.submission.offlineTitle)}
        tone="warning"
      >
        {t(M.submission.offlineBody)}
      </Alert>
    );
  } else if (failure?.error.code === 'CANCELLED') {
    content = (
      <Alert title={t(M.submission.cancelledTitle)} tone="info">
        {t(M.submission.cancelledBody)}
      </Alert>
    );
  } else if (failure) {
    const { error } = failure;
    const presentation = errorPresentation(error);
    const requestId =
      presentation.showRequestId && error.requestId ? (
        <span className="wizard-alert-line wizard-alert-detail">
          {t(M.submission.requestId, { requestId: `\u2066${error.requestId}\u2069` })}
        </span>
      ) : null;

    if (error instanceof ValidationError) {
      const rejected = rejectedFields(error.fieldErrors);
      const idInfoRejected = Object.keys(rejected.idInfo).length > 0;
      content = (
        <Alert
          actions={
            rejected.passportRejected ? (
              <a
                className="wizard-link"
                href={passportStepHref}
                onClick={(event) => {
                  event.preventDefault();
                  onOpenPassportStep(rejected.passport[0]);
                }}
              >
                {t(M.submission.fixPassport)}
              </a>
            ) : undefined
          }
          title={t(M.submission.invalidTitle)}
          tone="error"
        >
          {idInfoRejected || !rejected.passportRejected ? (
            <span className="wizard-alert-line">{t(M.submission.invalidBody)}</span>
          ) : null}
          {rejected.passportRejected ? (
            <span className="wizard-alert-line">{t(M.submission.invalidPassportBody)}</span>
          ) : null}
        </Alert>
      );
    } else if (presentation.action === 'retry') {
      offersPayload = true;
      content = (
        <Alert
          actions={
            <>
              <Button size="sm" onClick={onRetry}>
                {t(M.submission.tryAgain)}
              </Button>
              <button
                aria-expanded={payloadOpen}
                className="wizard-link"
                type="button"
                onClick={() => setPayloadOpen((open) => !open)}
              >
                {t(payloadOpen ? M.submission.hidePayload : M.submission.viewPayload)}
              </button>
            </>
          }
          title={t(M.submission.failedTitle)}
          tone="error"
        >
          <span className="wizard-alert-line">{t(M.submission.failedBody)}</span>
          <span className="wizard-alert-line wizard-alert-detail">{t(presentation.message)}</span>
          {requestId}
        </Alert>
      );
    } else {
      content = (
        <Alert title={t(M.submission.failedTitle)} tone="error">
          <span className="wizard-alert-line">{t(presentation.message)}</span>
          {requestId}
        </Alert>
      );
    }
  }

  if (content === null) return null;

  return (
    <div className="wizard-alert" ref={focusRef} tabIndex={-1}>
      {content}
      {failure && offersPayload && payloadOpen ? (
        <PayloadViewer
          defaultOpen
          fileName="application-payload.json"
          payload={failure.payload}
          title={t(M.payload.title)}
        />
      ) : null}
    </div>
  );
}
