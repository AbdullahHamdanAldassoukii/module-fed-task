# Passport Wizard

This pnpm monorepo contains two React applications: the host wizard at `:3000` and the remote passport form at `:3001`. It uses React 18, TypeScript, Rsbuild, and Module Federation. pnpm manages the workspace and Turborepo runs its scripts.

## Setup

Prerequisites: Node.js `>=22.22.1` and pnpm `9.15.9`. Docker is needed only for the Compose environments.

| Task                         | Command                                              |
| ---------------------------- | ---------------------------------------------------- |
| Install                      | `pnpm install`                                       |
| Run both apps                | `pnpm dev`                                           |
| Run with MUI                 | `pnpm dev:mui`                                       |
| Unit and component tests     | `pnpm test`                                          |
| Install the E2E browser once | `pnpm --filter e2e exec playwright install chromium` |
| Run E2E tests                | `pnpm e2e`                                           |
| Build                        | `pnpm build`                                         |
| Run Docker QA                | `pnpm docker:qa`                                     |
| Run Docker production        | `pnpm docker:prod`                                   |

Open `http://localhost:3000` for the wizard. The remote standalone page is at `http://localhost:3001`.

## Module Federation config

The remote exposes one component.

```ts
pluginModuleFederation({
  name: 'passport_form',
  exposes: { './PassportForm': './src/exposes/PassportForm.tsx' },
  shared: sharedDeps(UI_KIT),
  dts: false,
});
```

The host names the remote, shares dependencies, and installs its retry runtime hook.

```ts
const react = { singleton: true, strictVersion: true, requiredVersion: '^18.3.1' };

pluginModuleFederation({
  name: 'host_app',
  remotes: { passport_form: `passport_form@${REMOTE_MANIFEST_URL}` },
  shared: {
    react,
    'react-dom': react,
    '@emotion/react': { singleton: true, requiredVersion: '^11.14.0' },
    '@emotion/styled': { singleton: true, requiredVersion: '^11.14.0' },
    '@mui/material': { requiredVersion: '^9.4.0' },
    '@mui/material/': { requiredVersion: '^9.4.0' },
    '@mui/x-date-pickers': { requiredVersion: '^9.14.0' },
    '@mui/x-date-pickers/': { requiredVersion: '^9.14.0' },
    dayjs: { requiredVersion: '^1.11.0' },
  },
  shareStrategy: 'loaded-first',
  runtimePlugins: [path.resolve(import.meta.dirname, 'src/remotes/runtime/retryPlugin.ts')],
  dts: false,
});
```

- I chose `dts: false` because the contract package owns the explicit public types.
- I chose `loaded-first` so the host can render before a remote manifest is requested.
- Runtime `config.json` can force-register a remote URL that differs from the build-time URL.
- MUI deep imports need trailing-slash share keys; React is singleton and version-checked.

## Component interface

```ts
type PassportFormState =
  { valid: true; data: PassportData } | { valid: false; data: PassportDraft };

interface PassportFormProps {
  initialValue?: PassportDraft;
  onChange: (state: PassportFormState) => void;
  locale: 'en' | 'ar';
  colorScheme: 'light' | 'dark';
}

interface PassportFormModule {
  default: ComponentType<PassportFormProps>;
  contractVersion: string; // currently '1.0.0'
}
```

The host keeps the remote boundary inside `PassportFormSlot`.

```tsx
<PassportFormSlot
  value={state.passport.data}
  onChange={(passport) => dispatch({ type: 'passportChanged', state: passport })}
  locale={locale}
  colorScheme={colorScheme}
/>
```

`onChange` reports a complete payload only when valid. Invalid states retain the draft shape.

```ts
onChange({ valid: true, data: validPassportData });
onChange({ valid: false, data: { ...draft, expiryDate: '2024-01-10' } });
```

## Assumptions

- Emirates ID is 15 digits starting with `784`; I do not validate its checksum or year because they are outside the requested format.
- Dates use real calendar dates in `YYYY-MM-DD`; expiry must be after issue date.
- Documents accept PDF, PNG, JPEG, and `image/jpg`.
- There is no application-level file size limit.
- The draft is stored in `sessionStorage`; on quota failure, answers remain and the document is requested again.
- Confirmation is an end state; its summary excludes document content.
- The API is mocked for browser, test, and Docker execution.

## Architecture in brief

```text
apps/
  host-app/src/{app,features,remotes,lib,components}
  passport-form/src/{exposes,features,standalone,lib}
packages/
  passport-contract/src
  ui/src
  i18n/src
  api-mocks/src
e2e/tests
docs/adr
```

Layer rules are enforced by ESLint: features do not import one another, and browser or third-party access has a defined home. `UI_KIT` selects shadcn by default or MUI at build time behind `@repo/ui`. Translation keys are typed constants, and lint rejects free-text keys. Features call a small `HttpClient` port; transport code handles headers, timeouts, parsing, errors, and retries. The host validates remote state and contract version, then shows loading, fallback, or configuration errors at the boundary.

## ADR index

- [0001](docs/adr/0001-pnpm-monorepo-turborepo.md) — pnpm workspace and Turborepo.
- [0002](docs/adr/0002-federated-component-with-contract-and-adapter.md) — federated component, contract, and host adapter.
- [0003](docs/adr/0003-ui-kit-boundary-and-build-time-kit-flag.md) — UI boundary and build-time `UI_KIT`.
- [0004](docs/adr/0004-rstack-toolchain.md) — Rsbuild, Rstest, bundle inspection, and browser tests.
- [0005](docs/adr/0005-contract-versioning-and-runtime-validation.md) — contract compatibility and runtime parsing.
- [0006](docs/adr/0006-http-client-port-with-two-transports.md) — HTTP port and two transports.
- [0007](docs/adr/0007-runtime-config-per-environment.md) — runtime `config.json` by environment.

## What I'd add next

- A real API endpoint with authentication and server-side document handling.
- File scanning, size limits, and clearer upload limits.
- Server-backed draft recovery for authenticated users.
- Telemetry for remote loading, contract mismatches, and submission failures.
- Accessibility testing with screen readers and keyboard-only journeys.
