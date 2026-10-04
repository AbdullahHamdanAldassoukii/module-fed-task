import {
  lazy,
  Suspense,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type {
  PassportDraft,
  PassportFormColorScheme,
  PassportFormLocale,
  PassportFormModule,
  PassportFormState,
} from '@repo/passport-contract';
import { useServices } from '../../hooks/useServices';
import { RemoteContractError, RemoteLoadError } from '../../lib/errors';
import { getRemoteScenarioRevision, subscribeRemoteScenario } from './devScenarios';
import { LoadingSlot } from './LoadingSlot';
import { RemoteUnavailable } from './RemoteUnavailable';
import { createStateGuard } from './stateGuard';

// `_attempt` is a useMemo dependency that gives every retry a new React.lazy cache.
function createLazyRemote(
  loader: { load: () => Promise<PassportFormModule> },
  _attempt: number,
  _scenarioRevision: number,
) {
  return lazy(async () => {
    const module = await loader.load();
    return { default: module.default };
  });
}

function sameDocument(left: PassportDraft['document'], right: PassportDraft['document']): boolean {
  if (left === right) return true;
  if (!left || !right) return false;
  return (
    left.fileName === right.fileName &&
    left.mimeType === right.mimeType &&
    left.base64 === right.base64
  );
}

function sameFormState(left: PassportFormState | undefined, right: PassportFormState) {
  if (left?.valid !== right.valid) return false;

  return (
    left.data.passportNumber === right.data.passportNumber &&
    left.data.firstName === right.data.firstName &&
    left.data.lastName === right.data.lastName &&
    left.data.issueDate === right.data.issueDate &&
    left.data.expiryDate === right.data.expiryDate &&
    sameDocument(left.data.document, right.data.document)
  );
}

export interface PassportFormSlotProps {
  value: PassportDraft;
  onChange: (state: PassportFormState) => void;
  locale: PassportFormLocale;
  colorScheme: PassportFormColorScheme;
}

export function PassportFormSlot({ value, onChange, locale, colorScheme }: PassportFormSlotProps) {
  const { remotes, logger } = useServices();
  const [attempt, setAttempt] = useState(0);
  const scenarioRevision = useSyncExternalStore(
    subscribeRemoteScenario,
    getRemoteScenarioRevision,
    getRemoteScenarioRevision,
  );
  const guard = useMemo(() => createStateGuard(logger), [logger]);
  const latestValue = useRef(value);
  const latestOnChange = useRef(onChange);
  const lastForwarded = useRef<PassportFormState>();

  useLayoutEffect(() => {
    latestValue.current = value;
  }, [value]);
  useLayoutEffect(() => {
    latestOnChange.current = onChange;
  }, [onChange]);

  const handleChange = useCallback(
    (raw: unknown) => {
      const state = guard(raw, latestValue.current);
      if (sameFormState(lastForwarded.current, state)) return;

      lastForwarded.current = state;
      latestOnChange.current(state);
    },
    [guard],
  );
  const Remote = useMemo(
    () => createLazyRemote(remotes.passportForm, attempt, scenarioRevision),
    [attempt, remotes.passportForm, scenarioRevision],
  );
  const retry = useCallback(
    (error: unknown) => {
      if (error instanceof RemoteLoadError) remotes.passportForm.reset();
      setAttempt((current) => current + 1);
    },
    [remotes.passportForm],
  );

  return (
    <ErrorBoundary
      key={attempt}
      fallbackRender={({ error }) => (
        <RemoteUnavailable error={error} onRetry={() => retry(error)} />
      )}
      onError={(error, info) => {
        if (!(error instanceof RemoteContractError) && !(error instanceof RemoteLoadError)) {
          logger.error('remote.render_failed', { error, componentStack: info.componentStack });
        }
      }}
    >
      <Suspense fallback={<LoadingSlot />}>
        {/* eslint-disable-next-line react-hooks/static-components -- retry must recreate a rejected lazy component. */}
        <Remote
          colorScheme={colorScheme}
          initialValue={value}
          locale={locale}
          onChange={handleChange}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
