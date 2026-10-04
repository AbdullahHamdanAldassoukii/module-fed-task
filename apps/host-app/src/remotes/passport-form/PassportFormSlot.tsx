import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type LazyExoticComponent,
  type RefObject,
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

interface ModuleLoader {
  load: () => Promise<PassportFormModule>;
}
type LazyRemote = LazyExoticComponent<PassportFormModule['default']>;

/**
 * One React.lazy per loader, shared by every mount of the slot: once resolved it renders at
 * once, so going Back to Step 1 shows the form without a skeleton flash. A failed load drops
 * its entry, so the next mount or Try again loads again.
 */
const lazyRemotes = new WeakMap<ModuleLoader, { revision: number; component: LazyRemote }>();

function lazyRemoteFor(loader: ModuleLoader, revision: number): LazyRemote {
  const cached = lazyRemotes.get(loader);
  if (cached?.revision === revision) return cached.component;

  const component: LazyRemote = lazy(() =>
    loader.load().then(
      (module) => ({ default: module.default }),
      (error: unknown) => {
        if (lazyRemotes.get(loader)?.component === component) lazyRemotes.delete(loader);
        throw error;
      },
    ),
  );
  lazyRemotes.set(loader, { revision, component });
  return component;
}

const FIRST_FIELD =
  'input:not([type="hidden"]):not([type="file"]):not([disabled]), select:not([disabled]), textarea:not([disabled])';

/** Rendered next to the remote, so its effect runs once the remote's fields exist. */
function FocusFirstField({ containerRef }: { containerRef: RefObject<HTMLElement> }) {
  useEffect(() => {
    // After the page's own focus handling (the step heading) has run.
    const frame = requestAnimationFrame(() => {
      containerRef.current?.querySelector<HTMLElement>(FIRST_FIELD)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [containerRef]);

  return null;
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
  /** Moves focus to the form's first field once it has rendered (e.g. after starting over). */
  autoFocusFirstField?: boolean;
}

export function PassportFormSlot({
  value,
  onChange,
  locale,
  colorScheme,
  autoFocusFirstField = false,
}: PassportFormSlotProps) {
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
  const containerRef = useRef<HTMLDivElement>(null);

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
  // Looked up on every render: after a failed load, Try again re-renders and gets a fresh one.
  const Remote = lazyRemoteFor(remotes.passportForm, scenarioRevision);
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
      <div ref={containerRef}>
        <Suspense fallback={<LoadingSlot />}>
          {/* eslint-disable-next-line react-hooks/static-components -- one lazy component per loader, cached outside render; retry must replace a rejected one. */}
          <Remote
            colorScheme={colorScheme}
            initialValue={value}
            locale={locale}
            onChange={handleChange}
          />
          {autoFocusFirstField ? <FocusFirstField containerRef={containerRef} /> : null}
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
