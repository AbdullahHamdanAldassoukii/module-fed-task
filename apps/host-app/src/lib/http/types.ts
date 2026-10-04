import type { Logger } from '../logger';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 300,
  maxDelayMs: 3_000,
};

export interface HttpRequest<T> {
  path: string;
  method: HttpMethod;
  body?: unknown;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  parse: (data: unknown) => T;
  signal?: AbortSignal;
  timeoutMs?: number;
  idempotencyKey?: string;
  retry?: RetryPolicy | false;
}

export interface HttpClient {
  send<T>(request: HttpRequest<T>): Promise<T>;
}

export interface TransportRequest {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: string;
  signal: AbortSignal;
}

export interface TransportResponse {
  status: number;
  headers: { get(name: string): string | null };
  body: unknown;
}

export type Transport = (request: TransportRequest) => Promise<TransportResponse>;

export interface HttpClientOptions {
  baseUrl: string;
  defaultTimeoutMs: number;
  logger: Logger;
  getLanguage?: () => string;
  defaultHeaders?: () => Record<string, string>;
  sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
  random?: () => number;
  newRequestId?: () => string;
}
