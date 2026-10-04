import { describe, expect, it, rs } from '@rstest/core';
import type { HttpClient, HttpRequest } from '../../../lib/http';
import { createOnboardingApi } from './createOnboardingApi';

describe('createOnboardingApi', () => {
  it('submits the assessment payload with its idempotency key', async () => {
    const send = rs.fn(async (request: HttpRequest<unknown>) =>
      request.parse({ referenceId: 'APP-1', submittedAt: '2026-10-04T00:00:00Z' }),
    );
    const api = createOnboardingApi({ send: send as HttpClient['send'] });
    const payload = {
      passport: {} as never,
      idInfo: { idNumber: '784', nationality: 'AE' as const },
    };

    await expect(
      api.submitApplication(payload, { idempotencyKey: 'submission-1' }),
    ).resolves.toEqual({
      referenceId: 'APP-1',
      submittedAt: '2026-10-04T00:00:00Z',
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/applications',
        body: payload,
        idempotencyKey: 'submission-1',
      }),
    );
  });

  it('rejects a response without the required reference', async () => {
    const http: HttpClient = { send: async (request) => request.parse({ submittedAt: 'today' }) };

    await expect(
      createOnboardingApi(http).submitApplication(
        { passport: {} as never, idInfo: { idNumber: '', nationality: 'AE' } },
        { idempotencyKey: 'submission-1' },
      ),
    ).rejects.toThrow(/referenceId/);
  });
});
