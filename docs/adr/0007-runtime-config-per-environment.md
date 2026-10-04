# 0007: Runtime configuration per environment

## Context

The same host build needs development, QA, and production settings for API location, remote manifest, logging, and developer controls. Rebuilding for each environment makes the artifact depend on deployment configuration and hides the actual runtime values.

## Decision

I chose committed `config.json` files selected at runtime. Development serves the selected JSON through Rsbuild; Docker nginx serves the file selected by `APP_ENV`. The host validates the file with zod before rendering. The Module Federation URL remains in the build config and is overridden with `registerRemotes(..., { force: true })` only when runtime configuration differs.

## Alternatives considered

I rejected a separate application image for each environment because the runtime settings do not require different code. I rejected runtime-only remote registration because it would hide the classic Federation configuration. I rejected secrets in JSON because every browser bundle and response is readable by its user.

## Consequences

One image can serve QA or production with different public configuration. Invalid configuration stops startup with a plain configuration error screen. The schema rejects a production configuration that sets `features.browserMocks` or `features.devPanel` to true, so neither can be switched on in production by editing `config.json`. Remote chunks remain portable because the remote uses `assetPrefix: 'auto'`.

## What I checked

I checked the Module Federation 2.9.2 runtime registration behavior. Forced registration clears manifest, module, and in-flight loading entries. Rejected manifest requests are not cached, but a hanging request is, which is why retry force-registers. I also checked the nginx cache split: manifest entry points are `no-cache` and hashed assets are immutable.

## Status / Date

Accepted — 2026-10-04
