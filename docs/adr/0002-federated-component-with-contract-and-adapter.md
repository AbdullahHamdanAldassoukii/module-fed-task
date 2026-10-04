# 0002: Federated component with contract and adapter

## Context

The host must use a remote passport form without letting Federation details or untyped values spread into feature code. A remote can be unavailable, slow, crash during rendering, send an incompatible module, or report malformed state.

## Decision

I chose a federated React component typed by `@repo/passport-contract`. The host uses `PassportFormSlot` as an anti-corruption adapter. It owns lazy loading, timeout handling, major-version checks, runtime state parsing, fallback UI, and retry. Retry is offered for load failures and render crashes, not for an incompatible contract, which would fail the same way again. The remote exposes a default component and `contractVersion`. I set the host Federation `shareStrategy` to `loaded-first`, so it can render before the remote manifest is requested by the slot.

## Alternatives considered

I rejected a Module Federation Bridge mount API because the public requirement is a component boundary, not an imperative mount point. I rejected DOM events because they make the payload and lifecycle untyped and difficult to validate.

## Consequences

The host feature receives typed props and state while only the adapter knows the remote module identifier. A remote crash can remount with the host’s last draft. This adds a small adapter layer and a contract package, but it gives failures one predictable presentation path.

## What I checked

I checked Module Federation 2.9.2 runtime behavior. Its default `version-first` strategy waits for remote manifests during host startup, which blanked a fresh page when the remote was down or slow. `loaded-first` defers the manifest until the slot loads. Rejected manifest loads are retried naturally, but a hanging manifest load stays cached, so retry uses forced remote registration to clear the in-flight cache. I also checked that trailing-slash MUI shared keys work only with `requiredVersion`, not `import` or `shareKey`.

## Status / Date

Accepted — 2026-10-04
