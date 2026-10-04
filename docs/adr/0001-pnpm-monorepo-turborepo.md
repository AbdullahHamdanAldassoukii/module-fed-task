# 0001: pnpm monorepo and Turborepo

## Context

The host, remote, contract, UI boundary, mocks, and shared tooling change together but have different dependency needs. I need local development to consume the same TypeScript sources that the applications use, without publishing packages for every change.

## Decision

I chose a pnpm workspace with a root version catalog and Turborepo scripts. Internal packages export TypeScript source through their package `exports` fields. The root owns common commands for development, linting, type checking, testing, building, formatting, Docker, and e2e.

## Alternatives considered

I considered separate repositories and published package versions. That adds release coordination before a host and remote change can be tested together. I also considered copying shared code into each application. That would make the contract and UI boundary drift.

## Consequences

The repository has one lockfile, one dependency catalog, and clear package ownership. pnpm enforces declared workspace dependencies. Source consumption keeps changes immediate, but it means application builds must include the workspace packages. Turborepo provides one task graph and cache for the commands rather than a custom collection of shell scripts.

## What I checked

I checked the installed Turborepo version, 2.11.7, and its bundled command documentation before using repository-level commands. I also checked that pnpm 9.15.9 works on the installed Node runtime without Corepack. For the workspace boundaries, I checked eslint-plugin-boundaries 7.2.0: `checkAllOrigins` and the TypeScript import resolver are needed for the configured TypeScript paths and dynamic imports to be checked.

## Status / Date

Accepted — 2026-10-04
