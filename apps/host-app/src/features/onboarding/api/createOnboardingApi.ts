import type { HttpClient } from '../../../lib/http';
import { parseSubmitApplicationResponse, type ApplicationPayload } from '../model';

export const SUBMIT_TIMEOUT_MS = 15_000;

export function createOnboardingApi(http: HttpClient) {
  return {
    submitApplication: (
      payload: ApplicationPayload,
      options: { idempotencyKey: string; signal?: AbortSignal },
    ) =>
      http.send({
        method: 'POST',
        path: '/applications',
        body: payload,
        idempotencyKey: options.idempotencyKey,
        signal: options.signal,
        timeoutMs: SUBMIT_TIMEOUT_MS,
        retry: false,
        parse: parseSubmitApplicationResponse,
      }),
  };
}

export type OnboardingApi = ReturnType<typeof createOnboardingApi>;
