import { Alert, Button } from '@repo/ui';
import { toAppError } from '../../lib/errors';
import { M, useT } from '../../lib/i18n';

export function RemoteUnavailable({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useT();
  const appError = toAppError(error);

  return (
    <Alert
      actions={<Button onClick={onRetry}>{t(M.remote.tryAgain)}</Button>}
      title={t(M.remote.unavailableTitle)}
      tone="error"
    >
      {appError.code === 'REMOTE_CONTRACT'
        ? t(M.errors.remoteIncompatible)
        : t(M.remote.unavailable)}
    </Alert>
  );
}
