import { useMutation } from '@tanstack/react-query';
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { useServices } from '../../../hooks/useServices';
import { CancelledError, toAppError } from '../../../lib/errors';
import {
  buildApplicationPayload,
  parseIdInfo,
  parsePassportData,
  pendingIdempotencyKey,
  type ApplicationPayload,
} from '../model';
import { useOnboardingWizard } from './useOnboardingWizard';

interface SubmitVariables {
  payload: ApplicationPayload;
  idempotencyKey: string;
  signal: AbortSignal;
}

const SUBMIT_APPLICATION_KEY = ['onboarding', 'submitApplication'] as const;

export function useSubmitApplication({ onSucceeded }: { onSucceeded?: () => void } = {}) {
  const { config, onboardingApi } = useServices();
  const { state, dispatch } = useOnboardingWizard();
  const inFlight = useRef<{ controller: AbortController; variables: SubmitVariables } | null>(null);
  const latestOnSucceeded = useRef(onSucceeded);
  useLayoutEffect(() => {
    latestOnSucceeded.current = onSucceeded;
  }, [onSucceeded]);

  const { mutate, reset, isPaused } = useMutation({
    mutationKey: SUBMIT_APPLICATION_KEY,
    networkMode: 'online',
    retry: false,
    mutationFn: async ({ payload, idempotencyKey, signal }: SubmitVariables) => {
      if (signal.aborted) throw new CancelledError();
      return onboardingApi.submitApplication(payload, { idempotencyKey, signal });
    },
    onSuccess: (result, { payload, idempotencyKey }) => {
      inFlight.current = null;
      dispatch({ type: 'submitSucceeded', idempotencyKey, payload, ...result });
      latestOnSucceeded.current?.();
    },
    onError: (error, { payload, idempotencyKey }) => {
      if (error instanceof CancelledError) return;
      inFlight.current = null;
      dispatch({ type: 'submitFailed', idempotencyKey, payload, error: toAppError(error) });
    },
  });

  const passportData = state.passport.data;
  const passport = useMemo(() => parsePassportData(passportData), [passportData]);
  const idInfo = useMemo(() => parseIdInfo(state.idInfo.values), [state.idInfo.values]);
  const { submission } = state;
  const canSubmit =
    state.passport.valid &&
    state.idInfo.valid &&
    passport.ok &&
    idInfo !== null &&
    submission.status !== 'submitting' &&
    submission.status !== 'succeeded';

  const submit = useCallback(() => {
    if (!canSubmit || !passport.ok || !idInfo) return;

    // Validate remote data again at the host boundary.
    const payload = buildApplicationPayload(passport.value, idInfo);
    if (config.env === 'development' || config.env === 'qa') {
      // eslint-disable-next-line no-console -- required output
      console.log('[submit] payload', payload);
    }
    const idempotencyKey = pendingIdempotencyKey(submission) ?? crypto.randomUUID();
    const controller = new AbortController();
    const variables: SubmitVariables = { payload, idempotencyKey, signal: controller.signal };
    inFlight.current = { controller, variables };

    dispatch({ type: 'submitStarted', idempotencyKey });
    mutate(variables);
  }, [canSubmit, config.env, dispatch, idInfo, mutate, passport, submission]);

  const cancel = useCallback(() => {
    const current = inFlight.current;
    if (!current) return;

    inFlight.current = null;
    current.controller.abort();
    reset();
    const { payload, idempotencyKey } = current.variables;
    dispatch({ type: 'submitFailed', idempotencyKey, payload, error: new CancelledError() });
  }, [dispatch, reset]);

  return { canSubmit, submit, cancel, isWaitingForNetwork: isPaused };
}
