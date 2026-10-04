import axios from 'axios';
import { decodeBody } from './decodeBody';
import type { Transport } from './types';

function headerValue(value: unknown): string | null {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

export function createAxiosTransport(): Transport {
  const instance = axios.create({
    validateStatus: () => true,
    responseType: 'text',
    transformResponse: [(data: unknown) => data],
  });

  return async ({ url, method, headers, body, signal }) => {
    const response = await instance.request<string>({ url, method, headers, data: body, signal });
    const responseHeaders: Record<string, unknown> = response.headers;
    return {
      status: response.status,
      headers: {
        get: (name) => headerValue(responseHeaders[name.toLowerCase()]),
      },
      body: decodeBody(response.data, headerValue(responseHeaders['content-type'])),
    };
  };
}
