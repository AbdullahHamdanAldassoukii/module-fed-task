import { afterAll, afterEach, beforeAll, describe, expect, it } from '@rstest/core';
import { server } from './node';
import { SCENARIO_HEADER } from './scenarios';

const url = 'http://localhost:3002/api/applications';
const body = JSON.stringify({
  passport: { passportNumber: 'A1' },
  idInfo: { idNumber: '784-1234-5678901-2', nationality: 'AE' },
});
const post = (headers: Record<string, string> = {}) =>
  fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body });

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('POST /api/applications', () => {
  it('returns 201 with a reference and timestamp by default', async () => {
    const res = await post();
    expect(res.status).toBe(201);
    const json = (await res.json()) as { referenceId: string; submittedAt: string };
    expect(json.referenceId).toMatch(/^APP-[A-Z0-9]{6}$/);
    expect(Number.isNaN(Date.parse(json.submittedAt))).toBe(false);
  });
  it('is idempotent per Idempotency-Key', async () => {
    const a = (await (await post({ 'idempotency-key': 'k1' })).json()) as { referenceId: string };
    const b = (await (await post({ 'idempotency-key': 'k1' })).json()) as { referenceId: string };
    const c = (await (await post({ 'idempotency-key': 'k2' })).json()) as { referenceId: string };
    expect(a.referenceId).toBe(b.referenceId);
    expect(a.referenceId).not.toBe(c.referenceId);
  });
  it('rejects a body without passport/idInfo with 400', async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(400);
  });
  it('scenarios: server-error → 500, validation-error → 422 with fieldErrors', async () => {
    expect((await post({ [SCENARIO_HEADER]: 'server-error' })).status).toBe(500);
    const res = await post({ [SCENARIO_HEADER]: 'validation-error' });
    expect(res.status).toBe(422);
    const json = (await res.json()) as { fieldErrors: Record<string, string> };
    expect(json.fieldErrors['idInfo.idNumber']).toBeDefined();
  });
  it('scenario network-error rejects the fetch', async () => {
    await expect(post({ [SCENARIO_HEADER]: 'network-error' })).rejects.toThrow();
  });
  it('scenario slow answers after ~3s', async () => {
    const t = Date.now();
    const res = await post({ [SCENARIO_HEADER]: 'slow' });
    expect(res.status).toBe(201);
    expect(Date.now() - t).toBeGreaterThanOrEqual(2900);
  }, 10_000);
  it('unknown scenario falls back to success', async () => {
    expect((await post({ [SCENARIO_HEADER]: 'nope' })).status).toBe(201);
  });
});
