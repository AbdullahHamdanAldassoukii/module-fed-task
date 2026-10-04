import { appBoundaries, base, react, translationKeyGuard } from '@repo/eslint-config';

export default [
  ...base,
  ...react,
  ...translationKeyGuard,
  ...appBoundaries({ srcDir: 'src', rootDir: import.meta.dirname }),
];
