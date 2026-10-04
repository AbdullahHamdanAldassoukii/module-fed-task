import { HttpResponse, delay, http } from 'msw';
import { referenceIdFor } from './referenceId';
import { SCENARIO_HEADER, SCENARIOS, type Scenario } from './scenarios';

const seen = new Map<string, { referenceId: string; submittedAt: string }>();

function scenarioFrom(request: Request): Scenario {
  const raw = request.headers.get(SCENARIO_HEADER);
  return (SCENARIOS as readonly string[]).includes(raw ?? '') ? (raw as Scenario) : 'success';
}

function isApplicationBody(body: unknown): body is { passport: unknown; idInfo: unknown } {
  return typeof body === 'object' && body !== null && 'passport' in body && 'idInfo' in body;
}

export const handlers = [
  http.post('*/api/applications', async ({ request }) => {
    switch (scenarioFrom(request)) {
      case 'network-error':
        return HttpResponse.error();
      case 'timeout':
        await delay('infinite');
        break;
      case 'slow':
        await delay(3000);
        break;
      case 'server-error':
        return HttpResponse.json(
          { code: 'INTERNAL', message: 'Simulated server failure' },
          { status: 500 },
        );
      case 'validation-error':
        return HttpResponse.json(
          {
            code: 'VALIDATION',
            message: 'Some fields are invalid',
            fieldErrors: { 'idInfo.idNumber': 'INVALID_FORMAT' },
          },
          { status: 422 },
        );
      case 'success':
        break;
    }

    const body: unknown = await request.json().catch(() => null);
    if (!isApplicationBody(body)) {
      return HttpResponse.json(
        { code: 'BAD_REQUEST', message: 'Expected { passport, idInfo }' },
        { status: 400 },
      );
    }

    const key = request.headers.get('idempotency-key');
    const existing = key ? seen.get(key) : undefined;
    if (existing) return HttpResponse.json(existing, { status: 201 });

    const created = { referenceId: referenceIdFor(key), submittedAt: new Date().toISOString() };
    if (key) seen.set(key, created);
    return HttpResponse.json(created, { status: 201 });
  }),
];
