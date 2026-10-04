import type { HttpClient } from '../../../lib/http';
import { parseSubmitApplicationResponse, type ApplicationPayload } from '../model';

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
        parse: parseSubmitApplicationResponse,
      }),
  };
}

export type OnboardingApi = ReturnType<typeof createOnboardingApi>;
