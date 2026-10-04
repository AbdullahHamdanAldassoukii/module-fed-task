import { base } from '@repo/eslint-config';

export default [...base, { ignores: ['playwright-report/**', 'test-results/**'] }];
