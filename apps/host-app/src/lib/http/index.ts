import { createAxiosTransport } from './axiosTransport';
import { createHttpClient } from './core';
import { createFetchTransport } from './fetchTransport';
import type { HttpClientOptions } from './types';

export * from './types';
export { createHttpClient } from './core';
export { createAxiosTransport, createFetchTransport };

export const createAxiosHttpClient = (options: HttpClientOptions) =>
  createHttpClient(createAxiosTransport(), options);
export const createFetchHttpClient = (options: HttpClientOptions) =>
  createHttpClient(createFetchTransport(), options);
