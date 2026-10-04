# @repo/eslint-config

Shared flat ESLint config for the workspace.

- `base`: TypeScript with type information, import hygiene, and Prettier compatibility.
- `react`: react, react-hooks (including the React Compiler rules), and jsx-a11y.
- `appBoundaries({ srcDir, rootDir })`: the architecture rules for an app. It covers the
  layer graph, the ban on imports between features, the home of each third-party library,
  and the ban on browser globals outside their wrappers.
- `translationKeyGuard`: blocks literal and template-literal keys passed to `t()`, including
  member calls such as `translations.t('header.title')`.

Usage in an app:

```js
import { base, react, appBoundaries, translationKeyGuard } from '@repo/eslint-config';

export default [
  ...base,
  ...react,
  ...translationKeyGuard,
  ...appBoundaries({ srcDir: 'src', rootDir: import.meta.dirname }),
];
```

Translation calls use key constants created by `createMessageKeys`, for example
`t(M.header.title)`. This guard intentionally rejects `t('header.title')` and
`t(`header.${section}`)`. Add any app-specific `no-restricted-syntax` selectors to the
shared guard so its rule options remain in one flat-config block.

`rootDir` defaults to the working directory, which is right for `pnpm lint`. Pass the app
folder so the rules also classify files correctly when ESLint runs from the repo root, for
example in the pre-commit hook.

## Layers

| Folder                               | May import                                                                               |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| `app/`, `src/*.ts(x)`                | anything (composition root)                                                              |
| `exposes/`, `standalone/`            | anything (the remote's entry points)                                                     |
| `features/*/routes/`                 | own feature's components, hooks, model, lib; `remotes/`, `components/`, `hooks/`, `lib/` |
| `features/*/components/`             | own feature's hooks, model, lib; `remotes/`, `components/`, `hooks/`, `lib/`             |
| `features/*/hooks/`                  | own feature's api, model, lib; `hooks/`, `lib/`                                          |
| `features/*/api/`, `features/*/lib/` | own feature's model; `lib/`                                                              |
| `features/*/model/`                  | `@repo/passport-contract` and `zod` only                                                 |
| `remotes/`                           | `components/`, `hooks/`, `lib/`                                                          |
| `components/`                        | `hooks/`, `lib/`                                                                         |
| `hooks/`                             | `lib/`, and types from `app/` (`import type`)                                            |
| `lib/`                               | `lib/`                                                                                   |
| `testing/`                           | anything                                                                                 |

A feature never imports another feature. Test files (`*.test.ts(x)`) are not checked, and
product code never imports one. Every other source file must sit in one of these folders, be
an entry file at the source root, or be a declaration file under `types/`; a file anywhere
else fails lint, so a new folder cannot sidestep the rules.

## Library homes

| Library                                                        | Only in                                            |
| -------------------------------------------------------------- | -------------------------------------------------- |
| `axios`, `fetch`                                               | `lib/http` (`fetch` also in the composition root)  |
| `i18next`, `react-i18next`                                     | `lib/i18n`                                         |
| `zod`                                                          | `features/*/model`, `lib/config`                   |
| `@tanstack/react-query`                                        | feature hooks, `app/`                              |
| `react-hook-form`, `@hookform/resolvers`                       | feature hooks                                      |
| `@module-federation/*`, `passport_form/*`                      | `remotes/`, `app/`, bootstrap                      |
| `react-router`                                                 | `features/*/routes`, `app/`, `useWizardNavigation` |
| `msw`, `@repo/api-mocks`                                       | `app/`, bootstrap                                  |
| `localStorage`, `sessionStorage`                               | `lib/storage`                                      |
| Radix, MUI, Emotion, date pickers, dropzone, toasts, `cn`, cva | `packages/ui`; apps import `@repo/ui`              |
| `@repo/ui/shadcn`, `@repo/ui/mui`                              | nowhere: import `@repo/ui`                         |

`testing/` may also use MSW, React Router, TanStack Query, React Hook Form and Federation,
to build test doubles.
