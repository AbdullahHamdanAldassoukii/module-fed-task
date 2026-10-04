import boundaries from 'eslint-plugin-boundaries';

const FEATURE_LAYERS = [
  'feature-model',
  'feature-api',
  'feature-lib',
  'feature-hooks',
  'feature-components',
  'feature-routes',
];

const UI_KIT_MODULES = [
  'radix-ui',
  '@radix-ui/*',
  '@mui/*',
  '@emotion/*',
  'react-day-picker',
  'react-dropzone',
  'sonner',
  'notistack',
  'cn',
  'class-variance-authority',
];

const element = (...types) => ({ element: { type: types } });
const libModule = (name) => ({ element: { type: 'lib', captured: { module: name } } });
const external = (sources) => ({ module: { origin: 'external', source: sources } });

const ENTRY = { file: { categories: 'entry' } };
const COMPOSITION_ROOT = [element('app'), ENTRY];
const WIZARD_NAVIGATION = {
  element: { type: 'feature-hooks', fileInternalPath: '**/useWizardNavigation.{ts,tsx}' },
};

const LIBRARY_HOMES = [
  { modules: ['axios'], homes: [libModule('http')], where: 'lib/http' },
  { modules: ['i18next', 'react-i18next'], homes: [libModule('i18n')], where: 'lib/i18n' },
  {
    modules: ['zod'],
    homes: [element('feature-model'), libModule('config')],
    where: 'feature model/ and lib/config',
  },
  {
    modules: ['@tanstack/react-query'],
    homes: [element('feature-hooks', 'testing'), ...COMPOSITION_ROOT],
    where: 'feature hooks/ and app/',
  },
  {
    modules: ['react-hook-form', '@hookform/resolvers'],
    homes: [element('feature-hooks', 'testing')],
    where: 'feature hooks/',
  },
  {
    modules: ['@module-federation/*', 'passport_form'],
    homes: [element('remotes', 'testing'), ...COMPOSITION_ROOT],
    where: 'remotes/ and the app bootstrap',
  },
  {
    modules: ['react-router', 'react-router-dom'],
    homes: [element('feature-routes', 'testing'), WIZARD_NAVIGATION, ...COMPOSITION_ROOT],
    where: 'routes/, app/ and useWizardNavigation',
  },
  {
    modules: ['msw', '@repo/api-mocks'],
    homes: [element('testing'), ...COMPOSITION_ROOT],
    where: 'app/, the bootstrap and testing/',
  },
  {
    modules: UI_KIT_MODULES,
    homes: [],
    where: 'packages/ui; use the @repo/ui components',
  },
];

function homePolicies({ modules, homes, where }) {
  const policies = [
    {
      disallow: { to: external(modules) },
      message: `'{{ dependency.source }}' may only be imported in ${where}.`,
    },
  ];
  if (homes.length > 0) policies.push({ from: homes, allow: { to: external(modules) } });
  return policies;
}

export function appBoundaries({ srcDir = 'src', rootDir = process.cwd() } = {}) {
  const s = srcDir;
  const testFiles = `${s}/**/*.test.{ts,tsx}`;
  const elements = [
    { type: 'app', pattern: `${s}/app` },
    { type: 'lib', pattern: `${s}/lib/*`, capture: ['module'] },
    { type: 'lib', pattern: `${s}/lib` },
    { type: 'components', pattern: `${s}/components` },
    { type: 'hooks', pattern: `${s}/hooks` },
    { type: 'testing', pattern: `${s}/testing` },
    { type: 'remotes', pattern: `${s}/remotes` },
    { type: 'exposes', pattern: `${s}/exposes` },
    { type: 'standalone', pattern: `${s}/standalone` },
    ...FEATURE_LAYERS.map((type) => ({
      type,
      pattern: `${s}/features/*/${type.replace('feature-', '')}`,
      capture: ['feature'],
    })),
  ].map((descriptor) => ({ ...descriptor, partialMatch: false }));

  return [
    {
      files: [`${s}/**/*.{ts,tsx}`],
      ignores: [testFiles],
      plugins: { boundaries },
      settings: {
        'import/resolver': { typescript: { alwaysTryTypes: true } },
        'boundaries/root-path': rootDir,
        'boundaries/include': [`${s}/**/*`],
        'boundaries/elements': elements,
        'boundaries/files': [
          { category: 'test', pattern: testFiles },
          { category: 'entry', pattern: `${s}/*.{ts,tsx}` },
          { category: 'declaration', pattern: `${s}/types/**/*.d.ts` },
        ],
        'boundaries/dependency-nodes': ['import', 'dynamic-import', 'export'],
        'boundaries/flag-as-external': { customSourcePatterns: ['@repo/**'] },
      },
      rules: {
        'boundaries/no-unknown-files': 'error',
        'boundaries/dependencies': [
          'error',
          {
            default: 'disallow',
            checkAllOrigins: true,
            policies: [
              { allow: { to: { module: { origin: ['external', 'core'] } } } },

              {
                from: [element('app', 'exposes', 'standalone', 'testing'), ENTRY],
                allow: { to: { module: { origin: 'local' } } },
              },
              {
                from: element('feature-routes'),
                allow: {
                  to: element(
                    'feature-components',
                    'feature-hooks',
                    'feature-model',
                    'feature-lib',
                    'remotes',
                    'components',
                    'hooks',
                    'lib',
                  ),
                },
              },
              {
                from: element('feature-components'),
                allow: {
                  to: element(
                    'feature-hooks',
                    'feature-model',
                    'feature-lib',
                    'remotes',
                    'components',
                    'hooks',
                    'lib',
                  ),
                },
              },
              {
                from: element('feature-hooks'),
                allow: {
                  to: element('feature-api', 'feature-model', 'feature-lib', 'hooks', 'lib'),
                },
              },
              { from: element('feature-api'), allow: { to: element('feature-model', 'lib') } },
              { from: element('feature-lib'), allow: { to: element('feature-model', 'lib') } },
              { from: element('remotes'), allow: { to: element('components', 'hooks', 'lib') } },
              { from: element('components'), allow: { to: element('hooks', 'lib') } },
              { from: element('hooks'), allow: { to: element('lib') } },
              {
                from: element('hooks'),
                allow: { to: element('app'), dependency: { kind: 'type' } },
              },
              { from: element('lib'), allow: { to: element('lib') } },
              {
                from: element(...FEATURE_LAYERS),
                disallow: {
                  to: {
                    element: {
                      type: FEATURE_LAYERS,
                      captured: { feature: '!{{ from.element.captured.feature }}' },
                    },
                  },
                },
                message: 'A feature never imports another feature.',
              },
              {
                disallow: { to: { file: { categories: 'test' } } },
                message: 'Product code never imports test files.',
              },

              ...LIBRARY_HOMES.flatMap(homePolicies),
              {
                disallow: {
                  to: {
                    module: {
                      origin: 'external',
                      source: '@repo/ui',
                      internalPath: ['shadcn{,/**}', 'mui{,/**}'],
                    },
                  },
                },
                message: 'Import @repo/ui, never a kit folder; the build picks the kit.',
              },

              {
                from: element('feature-model'),
                disallow: { to: { module: { origin: ['external', 'core'] } } },
                message: 'model/ imports only @repo/passport-contract and zod.',
              },
              {
                from: element('feature-model'),
                allow: { to: external(['@repo/passport-contract', 'zod']) },
              },
            ],
          },
        ],
      },
    },

    {
      files: [`${s}/**/*.{ts,tsx}`],
      rules: {
        'no-restricted-globals': restrictedGlobals(['localStorage', 'sessionStorage', 'fetch']),
        'no-restricted-properties': restrictedProperties([
          'localStorage',
          'sessionStorage',
          'fetch',
        ]),
      },
    },
    {
      files: [`${s}/lib/storage/**`],
      rules: {
        'no-restricted-globals': restrictedGlobals(['fetch']),
        'no-restricted-properties': restrictedProperties(['fetch']),
      },
    },
    {
      files: [`${s}/lib/http/**`, `${s}/app/**`, `${s}/*.{ts,tsx}`],
      rules: {
        'no-restricted-globals': restrictedGlobals(['localStorage', 'sessionStorage']),
        'no-restricted-properties': restrictedProperties(['localStorage', 'sessionStorage']),
      },
    },
    {
      files: [testFiles, `${s}/testing/**`],
      rules: { 'no-restricted-globals': 'off', 'no-restricted-properties': 'off' },
    },
  ];
}

const GLOBAL_HOMES = {
  localStorage: 'lib/storage',
  sessionStorage: 'lib/storage',
  fetch: 'lib/http',
};

function restrictedGlobals(names) {
  return ['error', ...names.map((name) => ({ name, message: `Use ${GLOBAL_HOMES[name]}.` }))];
}

function restrictedProperties(names) {
  return [
    'error',
    ...names.flatMap((property) =>
      ['window', 'globalThis'].map((object) => ({
        object,
        property,
        message: `Use ${GLOBAL_HOMES[property]}.`,
      })),
    ),
  ];
}
