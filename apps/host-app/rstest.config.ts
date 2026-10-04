import { withRsbuildConfig } from '@rstest/adapter-rsbuild';
import { defineConfig } from '@rstest/core';

export default defineConfig({
  extends: withRsbuildConfig({
    cwd: import.meta.dirname,
    modifyRsbuildConfig: (config) => ({
      ...config,
      plugins: (config.plugins ?? []).flatMap((plugin) => {
        if (
          plugin &&
          typeof plugin === 'object' &&
          'name' in plugin &&
          typeof plugin.name === 'string' &&
          plugin.name.includes('module-federation')
        ) {
          return [];
        }
        return [plugin];
      }),
      server: { ...config.server, setup: undefined },
    }),
  }),
  testEnvironment: 'happy-dom',
  setupFiles: ['./src/testing/setup.ts'],
  include: ['src/**/*.test.{ts,tsx}'],
});
