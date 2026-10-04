import { Alert, Button } from '@repo/ui';
import { errorPresentation, isAppError, RemoteLoadError } from '../../lib/errors';
import { M, useT } from '../../lib/i18n';

export function RemoteUnavailable({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useT();
  const appError = isAppError(error) ? error : new RemoteLoadError('load-failed', { cause: error });
  const presentation = errorPresentation(appError);
  const canRetry = presentation.action === 'retry';

  return (
    <Alert
      actions={canRetry ? <Button onClick={onRetry}>{t(M.remote.tryAgain)}</Button> : undefined}
      title={t(M.remote.unavailableTitle)}
      tone="error"
    >
      {t(presentation.message)}
      {canRetry ? ` ${t(M.remote.unavailable)}` : null}
    </Alert>
  );
}
