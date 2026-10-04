import { base, react } from '@repo/eslint-config';

export default [
  ...base,
  ...react,
  { files: ['src/kits/shadcn/components/ui/**'], rules: { 'react/display-name': 'off' } },
  {
    // A Node script, typed by tsconfig.node.json rather than the browser library config.
    files: ['src/tokens/build-css.ts'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './tsconfig.node.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
