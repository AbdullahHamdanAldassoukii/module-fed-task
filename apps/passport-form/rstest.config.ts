import { defineConfig } from '@rstest/core';
import { withRsbuildConfig } from '@rstest/adapter-rsbuild';

function isModuleFederationPlugin(plugin: unknown): boolean {
  return (
    typeof plugin === 'object' &&
    plugin !== null &&
    'name' in plugin &&
    plugin.name === 'rsbuild:module-federation-enhanced'
  );
}

const domRsbuildConfig = withRsbuildConfig({
  cwd: import.meta.dirname,
  modifyRsbuildConfig: (config) => ({
    ...config,
    plugins: config.plugins?.filter((plugin) => !isModuleFederationPlugin(plugin)),
    dev: undefined,
    server: undefined,
  }),
});

export default defineConfig({
  projects: [
    {
      name: 'dom',
      extends: domRsbuildConfig,
      resolve: { aliasStrategy: 'prefer-alias' },
      testEnvironment: 'happy-dom',
      setupFiles: ['./src/testing/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
    },
    {
      name: 'scripts',
      testEnvironment: 'node',
      include: ['scripts/**/*.test.ts'],
    },
  ],
});
