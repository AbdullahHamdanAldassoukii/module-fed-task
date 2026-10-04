import { Button } from '@repo/ui';
import { useMemo } from 'react';
import { copyText } from '../../../lib/clipboard';
import { downloadTextFile } from '../../../lib/download';
import { M, useT } from '../../../lib/i18n';
import { notify } from '../../../lib/notify';
import {
  isPayloadPreviewShortened,
  payloadJson,
  payloadPreviewJson,
  type ApplicationPayload,
} from '../model';

export function PayloadViewer({
  payload,
  title,
  fileName,
  defaultOpen = false,
  id,
}: {
  payload: ApplicationPayload;
  title: string;
  fileName: string;
  defaultOpen?: boolean;
  id?: string;
}) {
  const { t } = useT();
  const preview = useMemo(() => payloadPreviewJson(payload), [payload]);

  const copy = async () => {
    const copied = await copyText(payloadJson(payload));
    notify(t(copied ? M.common.copied : M.common.copyFailed), {
      tone: copied ? 'success' : 'error',
    });
  };

  return (
    <details className="wizard-disclosure" id={id} open={defaultOpen}>
      <summary className="wizard-disclosure-summary">{title}</summary>
      <div className="wizard-disclosure-body">
        <div className="wizard-button-row">
          <Button size="sm" variant="secondary" onClick={() => void copy()}>
            {t(M.payload.copy)}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => downloadTextFile(fileName, payloadJson(payload))}
          >
            {t(M.payload.download)}
          </Button>
        </div>
        <pre className="wizard-code" dir="ltr">
          <code>{preview}</code>
        </pre>
        {isPayloadPreviewShortened(payload) ? (
          <p className="wizard-hint">{t(M.payload.shortened)}</p>
        ) : null}
      </div>
    </details>
  );
}
