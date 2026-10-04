# Architecture Decision Records

These records explain decisions that shape the repository.

| ADR                                                           | Decision                                        |
| ------------------------------------------------------------- | ----------------------------------------------- |
| [0001](0001-pnpm-monorepo-turborepo.md)                       | pnpm monorepo and Turborepo                     |
| [0002](0002-federated-component-with-contract-and-adapter.md) | Federated component, contract, and host adapter |
| [0003](0003-ui-kit-boundary-and-build-time-kit-flag.md)       | UI-kit boundary and build-time `UI_KIT`         |
| [0004](0004-rstack-toolchain.md)                              | Rsbuild, Rstest, Rsdoctor, and Playwright       |
| [0005](0005-contract-versioning-and-runtime-validation.md)    | Contract versioning and runtime validation      |
| [0006](0006-http-client-port-with-two-transports.md)          | HttpClient port with axios and fetch transports |
| [0007](0007-runtime-config-per-environment.md)                | Runtime `config.json` per environment           |

Use this structure for a new record:

```md
# NNNN: Short decision title

## Context

## Decision

## Alternatives considered

## Consequences

## What I checked

## Status / Date
```
