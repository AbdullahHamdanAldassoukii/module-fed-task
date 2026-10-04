# 0006: HttpClient port with two transports

## Context

Feature code needs a stable way to make validated requests while transport concerns stay in one place. I need browser MSW, Node tests, and Docker mocks to exercise the same HTTP behavior. Retrying in a query library as well as the HTTP layer would make retry counts unclear.

## Decision

I chose a small `HttpClient` port with axios as the default transport and a fetch transport as a proof implementation. Shared core code owns URL construction, request IDs, language and idempotency headers, timeouts, response parsing, error mapping, and retry policy. It sets the request ID and the idempotency key after the default and per-request headers, in any letter case, so a caller cannot replace them by accident. A shared MSW contract suite runs against both transports.

## Alternatives considered

I rejected direct `fetch` calls in features because parsing, errors, timeouts, and retries would be duplicated. I rejected a repository class hierarchy because the factory and inferred API are smaller in React code. I rejected TanStack Query retries; request safety belongs with the HTTP semantics.

## Consequences

Only transport files know axios or `fetch`. Requests must provide a parser, so malformed successful responses become `ResponseContractError`. Safe GET and idempotency-key requests can retry, while ordinary unsafe requests cannot. The default transport is swappable in tests without changing callers.

## What I checked

I checked TypeScript 5.9.3 and used its `AbortSignal.any` and `AbortSignal.timeout` support directly. Axios 1.20.0 supports the text response and identity transform used for common body decoding. I kept `@mswjs/http-middleware` 0.10.3 although it is deprecated because its successor requires MSW 3, while this repository uses MSW 2.15.

## Status / Date

Accepted — 2026-10-04
