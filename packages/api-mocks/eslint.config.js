import { base } from '@repo/eslint-config';

export default [...base, { files: ['src/server.ts'], rules: { 'no-console': 'off' } }];
