import { base, react } from '@repo/eslint-config';

export default [
  ...base,
  ...react,
  { files: ['src/kits/shadcn/components/ui/**'], rules: { 'react/display-name': 'off' } },
];
