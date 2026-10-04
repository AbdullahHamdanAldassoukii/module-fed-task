import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import importX from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { appBoundaries } from './boundaries.js';
import { react } from './react.js';

const TEST_FILES = ['**/*.test.{ts,tsx}', '**/testing/**'];

export const translationKeyGuard = [
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="t"][arguments.0.type="Literal"]',
          message: 'Pass a message key constant to t(), not a string literal.',
        },
        {
          selector: 'CallExpression[callee.name="t"][arguments.0.type="TemplateLiteral"]',
          message: 'Pass a message key constant to t(), not a template literal.',
        },
        {
          selector: 'CallExpression[callee.property.name="t"][arguments.0.type="Literal"]',
          message: 'Pass a message key constant to t(), not a string literal.',
        },
        {
          selector: 'CallExpression[callee.property.name="t"][arguments.0.type="TemplateLiteral"]',
          message: 'Pass a message key constant to t(), not a template literal.',
        },
      ],
    },
  },
];

export const base = defineConfig(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/public/mockServiceWorker.js',
    ],
  },
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: process.cwd() },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { 'import-x': importX },
    rules: {
      // Inline type imports can still load a module at runtime.
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/first': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: TEST_FILES,
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    files: ['src/tokens/**'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier,
);

export { react, appBoundaries };
