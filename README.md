# Passport Wizard

I built a TypeScript pnpm monorepo with a Module Federation host and remote. `host-app` runs the two-step wizard shell on port 3000. `passport-form` exposes the passport component and its standalone harness on port 3001.

## Setup instructions

Prerequisites:

- Node.js `>=22.22.1`
- pnpm `9.15.9`
- Docker, if running the QA or production Compose environments

On Node 25 or later, install pnpm directly because Corepack is not bundled. Then install dependencies:

```sh
pnpm install
```

Start both applications with browser MSW enabled:

```sh
pnpm dev
```

The host is at `http://localhost:3000` and the remote is at `http://localhost:3001`. To run the MUI build-time kit instead of the default shadcn kit:

```sh
pnpm dev:mui
```

Run the unit and component suites:

```sh
pnpm test
```

Install Chromium once for Playwright:

```sh
pnpm --filter e2e exec playwright install chromium
```

Run the browser suite:

```sh
pnpm e2e
```

Playwright starts the host and remote itself.

Run Docker Compose with the selected runtime configuration:

```sh
pnpm docker:qa
pnpm docker:prod
```

For the live remote fallback demonstration, start Compose, then stop the remote:

```sh
docker compose -f infra/docker-compose.yml stop passport-form
```

Open the host and retry the remote from its fallback. Restore it with `docker compose -f infra/docker-compose.yml start passport-form`.

The standalone remote harness renders the real exposed component, has language and theme controls, records reported state, and can remount with the last draft:

```sh
pnpm --filter passport-form dev
```

## Module Federation config

The remote exposes a React component:

```ts
pluginModuleFederation({
  name: 'passport_form',
  exposes: { './PassportForm': './src/exposes/PassportForm.tsx' },
  shared: sharedDeps(UI_KIT),
  dts: false,
});
```

The host declares the classic remote URL and its retry runtime plugin:

```ts
pluginModuleFederation({
  name: 'host_app',
  remotes: { passport_form: `passport_form@${REMOTE_MANIFEST_URL}` },
  shared: sharedDeps(UI_KIT),
  shareStrategy: 'loaded-first',
  runtimePlugins: [path.resolve(import.meta.dirname, 'src/remotes/runtime/retryPlugin.ts')],
  dts: false,
});
```

| Dependency                                            | Rule                                                   | Reason                                                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `react`, `react-dom`                                  | singleton, strict `^18.3.1`                            | Two copies break hooks and context.                                                                                            |
| `@emotion/react`, `@emotion/styled` (MUI)             | singleton                                              | Emotion context must be shared.                                                                                                |
| `@mui/material`, `@mui/x-date-pickers`, `dayjs` (MUI) | compatible shared dependency                           | Compatible copies deduplicate; incompatible copies can fall back.                                                              |
| `@mui/material/`, `@mui/x-date-pickers/` (MUI)        | trailing-slash prefix keys with only `requiredVersion` | Deep imports need a prefix rule. The fallback appends the deep path, so `import` and `shareKey` would make the fallback wrong. |
| Radix and Tailwind output (shadcn)                    | not shared                                             | Their contexts do not cross the remote boundary.                                                                               |
| i18next and `@repo/passport-contract`                 | not shared                                             | Each application owns its i18n instance and contract copy.                                                                     |

I set `dts: false` because the host deliberately owns a small ambient declaration for `passport_form/PassportForm`, typed as `PassportFormModule` from the contract package. That keeps the public boundary explicit instead of generating Federation declarations. The remote uses `assetPrefix: 'auto'` so its chunks load from the origin that served it.

I chose `shareStrategy: 'loaded-first'` for the host. The default `version-first` strategy loads remote manifests while the host starts. A down remote then leaves a blank page before the slot can show its skeleton or fallback. `loaded-first` defers that load until the slot requests the remote, so a fresh page can show loading, fallback, and recovery states.

The host first loads `/config.json`. If its `remotes.passportForm.manifestUrl` differs from the build-time URL, it calls `registerRemotes(..., { force: true })` before preloading the remote. The normal local URL stays visible in the build config. Docker nginx allows the host origin, serves manifests and `remoteEntry.js` with `no-cache`, and serves hashed assets as immutable.

## Component interface

The contract lives in `@repo/passport-contract` and exposes:

```ts
interface PassportFormProps {
  initialValue?: PassportDraft;
  onChange: (state: PassportFormState) => void;
  locale: 'en' | 'ar';
  colorScheme: 'light' | 'dark';
}

type PassportFormState =
  { valid: true; data: PassportData } | { valid: false; data: PassportDraft };

interface PassportFormModule {
  default: React.ComponentType<PassportFormProps>;
  contractVersion: string;
}
```

`initialValue` is read on mount. The remote reports its current state after mounting and when it changes. A compatible remote has the same semantic-version major as the host contract; additive optional props are minor changes. The host parser is a tolerant reader and ignores unknown fields.

```tsx
import { PassportFormSlot } from './remotes/passport-form';

<PassportFormSlot
  value={state.passport.data}
  onChange={(passport) => dispatch({ type: 'passportChanged', state: passport })}
  locale={locale}
  colorScheme={colorScheme}
/>;
```

The host adapter shows a skeleton immediately, adds “Still loading…” after three seconds, rejects a load after 15 seconds, checks module shape and contract major, guards every reported state, and isolates rendering failures. Retry resets its local loader; for a remote load failure it also force-registers the remote to clear a hanging Federation load.

The exposed remote currently renders the passport shell and reports an invalid initial draft. The ID-info route is also a placeholder, so no full application submission flow exists yet.

## Assumptions

- The contract represents dates as `YYYY-MM-DD` strings. No time zone conversion occurs in the contract helpers.
- `image/jpg` is accepted because it is in the accepted MIME-type list, although it is not a registered MIME type.
- The current shell has no field-entry, document, nationality, session-draft, or submission behavior. Those assumptions do not yet have runtime behavior to document.

## Architecture

The repository has two apps: `apps/host-app` is the composition root and `apps/passport-form` is the federated remote. Shared packages hold the contract, UI boundary, i18n helpers, mocks, lint rules, and TypeScript settings. `infra/` holds Docker and nginx configuration.

| Layer            | Folder                   | Rule                                           |
| ---------------- | ------------------------ | ---------------------------------------------- |
| Domain           | `model/`                 | Does not import React, UI kits, or networking. |
| Data access      | `api/`                   | The only feature code that uses `HttpClient`.  |
| React glue       | `hooks/`                 | Connects presentation to models and APIs.      |
| Presentation     | `components/`, `routes/` | Does not contain `fetch` or business rules.    |
| Composition root | `app/`                   | Constructs concrete services.                  |
| External adapter | `remotes/`               | Knows Module Federation.                       |

ESLint boundaries enforce that `app/` may import broadly; features cannot import another feature; `remotes/` own Federation access; and a feature flows from routes and components through hooks to APIs, with models reusable below that flow. Workspace package dependencies are also strict.

| Library or browser API                                                    | Home                                      |
| ------------------------------------------------------------------------- | ----------------------------------------- |
| UI kits, Radix, Tailwind, MUI, Emotion, date pickers, toasts, `cn`, `cva` | `packages/ui`                             |
| i18next and react-i18next                                                 | `packages/i18n` and each app’s `lib/i18n` |
| axios and `fetch`                                                         | `lib/http`                                |
| TanStack Query                                                            | feature hooks and `app/`                  |
| React Hook Form                                                           | feature hooks                             |
| Federation runtime                                                        | `remotes/` and app bootstrap              |
| React Router                                                              | routes, `app/`, and navigation hooks      |
| web storage                                                               | `lib/storage`                             |
| MSW                                                                       | `packages/api-mocks` and dev bootstrap    |
| zod                                                                       | models, config, and the contract package  |

Translation keys are typed constants built from the English resources. A lint guard rejects string literals and template literals passed to `t()`, so translation calls use those constants.

## Environments and configuration

|                 | Development                              | QA                        | Production                        |
| --------------- | ---------------------------------------- | ------------------------- | --------------------------------- |
| Run with        | `pnpm dev`                               | Compose with `APP_ENV=qa` | Compose with `APP_ENV=production` |
| API             | Browser MSW                              | mock HTTP server on 3002  | mock HTTP server on 3002          |
| Remote manifest | `http://localhost:3001/mf-manifest.json` | same                      | same                              |
| Log level       | debug                                    | info                      | warn                              |
| Dev panel       | shown                                    | shown                     | hidden                            |

The committed `apps/host-app/config/{development,qa,production}.json` files provide API, remote, logging, and feature settings. Development serves the chosen file at `/config.json`; Docker nginx selects it through `APP_ENV`. Everything in browser configuration is public, so no secrets belong in these files.

## Error handling

`AppError` normalizes network, timeout, HTTP, validation, response-contract, remote-load, remote-contract, configuration, cancellation, and unknown failures. A presentation table maps each error to a translated message, action, and request-ID visibility.

There are three current boundaries: the application boundary, the route error element, and the remote slot boundary. The adapter owns remote retries. `HttpClient` owns safe request retries: GET requests and idempotency-key requests can retry network, timeout, retryable HTTP, 408, and 429 failures with backoff and jitter. TanStack Query retries are disabled so retry ownership stays there.

## Testing

The current test pyramid is Rstest unit tests for contract, config, HTTP, error, storage, and wizard rules; component tests with Testing Library and happy-dom; adapter tests with fake remote modules; and one shared MSW Node contract suite for axios and fetch transports. UI contract tests run against both kits through the `UI_KIT` matrix.

```sh
pnpm test
pnpm test:mui
pnpm --filter passport-form check:css
```

Rsdoctor runs with `RSDOCTOR=true` through either app’s `analyze` script. Playwright starts both applications for `pnpm e2e`. The suite covers smoke checks, Arabic and RTL structure with an attached screenshot, remote down, slow, hung, and contract-mismatch fallback and recovery, the configuration error page, axe on every reachable state (including loading, open menus, and the compact mobile stepper) in English and Arabic across light and dark themes, and the standalone remote harness.

## Accessibility and i18n

The host has a skip link, a focusable main region, route error UI, and moves focus to the step heading after navigation. The UI-kit contract tests cover accessible field wiring and popup behavior. The remote currently exposes only a titled shell, so its field labels and error wiring are not present yet.

Both applications provide English and Arabic resources. Appearance state sets `lang`, `dir`, dark mode, and the resolved color scheme. The shared date formatter uses the `latn` numbering system, so displayed dates use Latin digits in Arabic as well.

The i18n instances use `initAsync: false`; i18next 26 replaced the older `initImmediate` option with this option.

## UI kit boundary and `UI_KIT`

`@repo/ui` is the only UI import allowed to features. Its API has one set of controlled component props and both kits satisfy the same `UiKit` shape. Rsbuild aliases `@repo/ui` to either `@repo/ui/shadcn` or `@repo/ui/mui` at build time; `UI_KIT=mui` selects MUI and shadcn is the default.

I keep two kits here to prove that features are isolated from visual-library APIs. A product would normally keep one kit because maintaining each component twice is a real cost. The host and standalone page render global styles; the exposed remote does not. Remote shadcn CSS is scoped under `[data-passport-form-root]`, while MUI uses its own Emotion cache and portal root.

## Version constraints

| Package                                | Version         | Reason                                           |
| -------------------------------------- | --------------- | ------------------------------------------------ |
| react, react-dom                       | 18.3.1          | Required runtime version.                        |
| typescript                             | 5.9.x           | Supported by typescript-eslint before 6.1.       |
| eslint                                 | 9.x             | jsx-a11y does not support ESLint 10.             |
| react-router                           | 7.x             | v8 requires React 19.                            |
| @rsbuild/core                          | 2.2.x           | Current Rsbuild line.                            |
| Module Federation packages             | 2.9.x           | Current Federation line.                         |
| @rstest/core, adapter-rsbuild          | 0.12.x          | Pre-1.0; Jest-compatible API gives an exit path. |
| msw                                    | 2.15.x          | MSW 3 is excluded.                               |
| axios                                  | 1.20.x          | Current transport version.                       |
| @mui/material, @mui/x-date-pickers     | 9.4.x / 9.14.x  | React 18 support.                                |
| tailwindcss, @tailwindcss/postcss      | 4.3.x           | Rsbuild PostCSS integration.                     |
| radix-ui                               | 1.6.x           | React 18 support.                                |
| @tanstack/react-query                  | 5.x             | Host data layer.                                 |
| react-hook-form, resolvers, zod        | 7.x / 5.x / 4.x | Form and schema stack.                           |
| i18next, react-i18next                 | 26.x / 17.x     | Typed instance-based i18n.                       |
| @playwright/test, @axe-core/playwright | 1.63.x / 4.13.x | Playwright browser and accessibility test suite. |

## What I would add in production

- File size limits, content sniffing, and malware scanning.
- A real backend, authentication, and durable audit logging.
- A Sentry or equivalent logger sink.
- A Luhn check for Emirates ID, after confirming the accepted sample data.
- Translation extraction tooling.
- Visual-regression baselines in each supported browser.

## ADRs

- [0001: pnpm monorepo and Turborepo](docs/adr/0001-pnpm-monorepo-turborepo.md)
- [0002: federated component, contract, and adapter](docs/adr/0002-federated-component-with-contract-and-adapter.md)
- [0003: UI-kit boundary and build-time flag](docs/adr/0003-ui-kit-boundary-and-build-time-kit-flag.md)
- [0004: Rstack toolchain](docs/adr/0004-rstack-toolchain.md)
- [0005: contract versioning and runtime validation](docs/adr/0005-contract-versioning-and-runtime-validation.md)
- [0006: HttpClient port and two transports](docs/adr/0006-http-client-port-with-two-transports.md)
- [0007: runtime configuration per environment](docs/adr/0007-runtime-config-per-environment.md)
