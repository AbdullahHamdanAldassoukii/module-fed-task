import { type ChildProcess, spawn } from 'node:child_process';
import { type AddressInfo, createServer } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from '@rstest/core';
import { SCENARIO_HEADER } from './scenarios';

let child: ChildProcess;
let origin: string;

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, () => {
      const { port } = probe.address() as AddressInfo;
      probe.close(() => resolve(port));
    });
  });
}

async function isHealthy(): Promise<boolean> {
  try {
    return (await fetch(`${origin}/health`)).ok;
  } catch {
    return false;
  }
}

const post = (headers: Record<string, string> = {}) =>
  fetch(`${origin}/api/applications`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:3000', ...headers },
    body: JSON.stringify({ passport: {}, idInfo: {} }),
  });

const spawnEntry = (port: number) =>
  spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
    cwd: `${import.meta.dirname}/..`,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'ignore'],
  });

beforeAll(async () => {
  const port = await freePort();
  origin = `http://127.0.0.1:${port}`;
  child = spawnEntry(port);
  const deadline = Date.now() + 10_000;
  while (!(await isHealthy())) {
    if (Date.now() > deadline) throw new Error('The mock server did not start.');
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}, 15_000);

afterAll(async () => {
  const exited = new Promise((resolve) => child.once('exit', resolve));
  child.kill();
  await exited;
});

describe('mock API HTTP server', () => {
  it('serves the handlers to another origin', async () => {
    const res = await post();
    expect(res.status).toBe(201);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(((await res.json()) as { referenceId: string }).referenceId).toMatch(/^APP-/);
  });

  it('allows the client headers in a CORS preflight', async () => {
    const res = await fetch(`${origin}/api/applications`, {
      method: 'OPTIONS',
      headers: {
        origin: 'http://localhost:3000',
        'access-control-request-method': 'POST',
        'access-control-request-headers': `content-type, idempotency-key, ${SCENARIO_HEADER}`,
      },
    });
    expect(res.status).toBe(204);
    const allowed = res.headers.get('access-control-allow-headers') ?? '';
    for (const header of ['content-type', 'idempotency-key', SCENARIO_HEADER]) {
      expect(allowed).toContain(header);
    }
  });

  it('drops the connection on network-error and keeps serving', async () => {
    await expect(post({ [SCENARIO_HEADER]: 'network-error' })).rejects.toThrow();
    expect(await isHealthy()).toBe(true);
  });
});

describe('mock API HTTP server on a busy port', () => {
  it('exits with an error instead of claiming to listen', async () => {
    const blocker = createServer();
    await new Promise<void>((resolve) => blocker.listen(0, resolve));
    const { port } = blocker.address() as AddressInfo;
    const entry = spawnEntry(port);
    let stdout = '';
    entry.stdout?.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
    try {
      const code = await new Promise<number | null>((resolve) => entry.once('exit', resolve));
      expect(code).not.toBe(0);
      expect(stdout).not.toContain('listening');
    } finally {
      entry.kill();
      await new Promise((resolve) => blocker.close(resolve));
    }
  }, 15_000);
});
