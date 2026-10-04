import path from 'node:path';
import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rstest/core';

const kit = process.env.UI_KIT === 'mui' ? 'mui' : 'shadcn';

export default defineConfig({
  plugins: [pluginReact()],
  testEnvironment: 'happy-dom',
  setupFiles: ['./src/testing/setup.ts'],
  include: ['src/**/*.test.{ts,tsx}'],
  resolve: {
    aliasStrategy: 'prefer-alias',
    alias: { '#kit': path.resolve(import.meta.dirname, 'src/kits', kit, 'index.ts') },
  },
  source: { define: { 'process.env.UI_KIT': JSON.stringify(kit) } },
});
