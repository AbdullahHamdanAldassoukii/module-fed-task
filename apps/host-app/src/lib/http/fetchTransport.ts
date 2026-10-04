import type { Transport } from './types';
import { decodeBody } from './decodeBody';

export function createFetchTransport(
  fetchImpl: typeof fetch = (...args) => fetch(...args),
): Transport {
  return async ({ url, method, headers, body, signal }) => {
    const response = await fetchImpl(url, { method, headers, body, signal });
    const text = await response.text();

    return {
      status: response.status,
      headers: { get: (name) => response.headers.get(name) },
      body: decodeBody(text, response.headers.get('content-type')),
    };
  };
}
