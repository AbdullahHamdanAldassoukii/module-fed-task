# 0004: Rstack toolchain

## Context

This repository needs one build configuration for two React applications, Module Federation, source workspace packages, unit and component tests, bundle inspection, and browser tests. Introducing another build tool only for tests would add a second configuration model.

## Decision

I chose Rsbuild for applications, Rstest for unit and component tests, Rsdoctor for optional bundle analysis, and Playwright for browser tests. Rstest reuses the Rsbuild configuration with the Federation plugin removed for tests. Rsdoctor is enabled with `RSDOCTOR=true`.

## Alternatives considered

I rejected Vitest because it brings Vite into an Rsbuild project. I also rejected making bundle inspection a separate permanent build pipeline; Rsdoctor is available when analysis is needed without changing normal builds.

## Consequences

The development, build, and test setups share React and alias behavior. Rstest is still pre-1.0, so its Jest-compatible API keeps a migration path open. The `e2e` workspace runs the Playwright suite through the root `pnpm e2e` command.

## What I checked

I checked Rsbuild 2.2.11 and Rstest 0.12.3. The test adapter supports `withRsbuildConfig`. Rsbuild 2.2 includes the built-in `rsbuild:rsdoctor` plugin, and this repository enables its installed Rsdoctor Rspack plugin when `RSDOCTOR=true`. I also checked that the Rsbuild development middleware API is `server.setup`, not the deprecated `dev.setupMiddlewares`.

## Status / Date

Accepted — 2026-10-04
