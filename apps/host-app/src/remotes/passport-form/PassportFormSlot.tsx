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
  PassportData,
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

export type PassportFocusTarget = 'firstField' | keyof PassportData;

const FIELD_ID = {
  passportNumber: 'pf-passport-number',
  firstName: 'pf-first-name',
  lastName: 'pf-last-name',
  issueDate: 'pf-issue-date',
  expiryDate: 'pf-expiry-date',
  document: 'pf-document',
} satisfies Record<keyof PassportData, string>;

const FOCUSABLE =
  'input:not([type="hidden"]):not([type="file"]):not([disabled]):not([aria-hidden="true"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [role="spinbutton"]';

function focusField(container: HTMLElement, target: PassportFocusTarget) {
  if (target === 'firstField') {
    container.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return;
  }
  const element = container.querySelector<HTMLElement>(`#${FIELD_ID[target]}`);
  element?.focus();
  if (!element || document.activeElement === element) return;
  for (let scope = element.parentElement; scope && scope !== container;) {
    // Some kits put the id on a hidden input.
    const control = scope.querySelector<HTMLElement>(FOCUSABLE);
    if (control) {
      control.focus();
      return;
    }
    scope = scope.parentElement;
  }
}

function FocusOnMount({
  containerRef,
  target,
}: {
  containerRef: RefObject<HTMLElement>;
  target: PassportFocusTarget;
}) {
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (containerRef.current) focusField(containerRef.current, target);
    });
    return () => cancelAnimationFrame(frame);
  }, [containerRef, target]);

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
  focusOnMount?: PassportFocusTarget;
}

export function PassportFormSlot({
  value,
  onChange,
  locale,
  colorScheme,
  focusOnMount,
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
      resetKeys={[scenarioRevision]}
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
          {/* eslint-disable-next-line react-hooks/static-components -- cached remote loader */}
          <Remote
            colorScheme={colorScheme}
            initialValue={value}
            locale={locale}
            onChange={handleChange}
          />
          {focusOnMount ? <FocusOnMount containerRef={containerRef} target={focusOnMount} /> : null}
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
