# 0005: Contract versioning and runtime validation

## Context

TypeScript checks the local build, but the host receives a remote module at runtime. A separately deployed remote can have a different module shape, contract version, or reported state. Compile-time constants cannot prove what the remote actually loaded.

## Decision

I chose semantic versioning in `@repo/passport-contract`, with compatibility defined as the same major version. The remote exports its runtime `contractVersion`; the host checks it after loading the module. The host also parses every reported passport state at runtime and falls back to the last known draft if parsing fails.

## Alternatives considered

I rejected relying only on a compile-time contract constant. Comparing a host constant to itself is a tautology and says nothing about the loaded remote. I rejected exact-version matching because additive optional props should not block compatible releases. I rejected trusting the remote’s `valid` flag without parsing its data.

## Consequences

Breaking changes require a major version and coordinated host support. Minor additions can remain compatible. The parser is a tolerant reader, so unknown fields do not break older hosts. Runtime validation adds a small amount of code but turns remote boundary failures into typed errors rather than downstream crashes.

## What I checked

I checked zod 4.6.5 and confirmed its safe-parse result typing works for the contract parser. I also checked its object behavior and pinned a tolerant-reader test: unknown object fields are stripped before the parsed state reaches the host.

## Status / Date

Accepted — 2026-10-04
