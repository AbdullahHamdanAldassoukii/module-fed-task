import { Alert, Button } from '@repo/ui';
import { useEffect, useMemo, useRef } from 'react';
import { useRouteError } from 'react-router';
import { useServices } from '../hooks/useServices';
import { errorPresentation, toAppError } from '../lib/errors';
import { M, useT } from '../lib/i18n';

export function RouteErrorPage() {
  const { t } = useT();
  const { logger } = useServices();
  const routeError = useRouteError();
  const error = useMemo(() => toAppError(routeError), [routeError]);
  const presentation = errorPresentation(error);
  const loggerRef = useRef(logger);

  useEffect(() => {
    loggerRef.current.error('route.error', { error });
  }, [error, routeError]);

  useEffect(() => {
    document.title = `${t(M.errors.crashTitle)} · ${t(M.app.title)}`;
  }, [t]);

  return (
    <main style={{ padding: 24 }}>
      <h1>{t(M.errors.crashTitle)}</h1>
      <Alert
        actions={<Button onClick={() => window.location.reload()}>{t(M.errors.reload)}</Button>}
        tone="error"
      >
        {t(presentation.message)}
        {presentation.showRequestId && error.requestId ? (
          <div>{t(M.errors.requestId, { id: error.requestId })}</div>
        ) : null}
      </Alert>
    </main>
  );
}
