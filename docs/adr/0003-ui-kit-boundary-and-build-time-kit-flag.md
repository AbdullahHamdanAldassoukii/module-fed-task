# 0003: UI-kit boundary and build-time `UI_KIT`

## Context

The host and remote need the same feature-facing UI API while proving that business features do not depend on shadcn, Radix, MUI, or Emotion. The remote also needs isolated CSS, direction, theme, and popup roots.

## Decision

I chose `@repo/ui` as the only UI import for feature code. It defines one controlled component API and each kit satisfies `UiKit`. Rsbuild resolves the package to shadcn by default or MUI when `UI_KIT=mui` is set at build time. The remote scopes shadcn CSS under its root and MUI uses a separate Emotion cache.

## Alternatives considered

I rejected a runtime kit switch. CSS and provider state cannot be cleanly unloaded at runtime, and a runtime `uiKit` value would leak into the contract. I also rejected letting features import each visual library directly because that removes the boundary being tested.

## Consequences

Features remain portable across the two kits and both kits run the same contract tests. Each component must be implemented and maintained twice. A production application would normally choose one kit after the boundary has served its purpose.

## What I checked

I checked that MUI X 9.14 removed the legacy field DOM and uses accessible field parts, so the MUI implementation follows its current slots. I configured `postcss-prefix-selector` 2.2.1 with the `scopeSelector` function rather than a static prefix, so root and dark selectors remain scoped correctly. I also checked Rsbuild alias precedence and set `prefer-alias` so MUI tests do not silently resolve the shadcn source.

## Status / Date

Accepted — 2026-10-04
