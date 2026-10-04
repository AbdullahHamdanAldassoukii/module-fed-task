import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';

const UI_KIT = process.env.UI_KIT === 'mui' ? 'mui' : 'shadcn';

function sharedDeps(kit: 'shadcn' | 'mui') {
  const singleton = { singleton: true, strictVersion: true, requiredVersion: '^18.3.1' };
  const base = { react: singleton, 'react-dom': singleton };

  if (kit !== 'mui') return base;

  return {
    ...base,
    '@emotion/react': { singleton: true, requiredVersion: '^11.14.0' },
    '@emotion/styled': { singleton: true, requiredVersion: '^11.14.0' },
    '@mui/material': { requiredVersion: '^9.4.0' },
    '@mui/material/': { requiredVersion: '^9.4.0' },
    '@mui/x-date-pickers': { requiredVersion: '^9.14.0' },
    '@mui/x-date-pickers/': { requiredVersion: '^9.14.0' },
    dayjs: { requiredVersion: '^1.11.0' },
  };
}

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'passport_form',
      exposes: { './PassportForm': './src/exposes/PassportForm.tsx' },
      shared: sharedDeps(UI_KIT),
      dts: false,
    }),
  ],
  html: {
    title: 'Passport Form (standalone)',
    meta: { viewport: 'width=device-width, initial-scale=1' },
  },
  source: {
    entry: { index: './src/index.ts' },
    include: [path.resolve(import.meta.dirname, '../../packages')],
    define: { 'import.meta.env.UI_KIT': JSON.stringify(UI_KIT) },
  },
  resolve: {
    aliasStrategy: 'prefer-alias',
    alias: {
      '@repo/ui$': `@repo/ui/${UI_KIT}`,
      '@remote-styles': path.resolve(import.meta.dirname, `src/styles/remote.${UI_KIT}.css`),
      '@standalone-styles': path.resolve(
        import.meta.dirname,
        `src/styles/standalone.${UI_KIT}.css`,
      ),
    },
  },
  server: { port: 3001, strictPort: true, cors: { origin: ['http://localhost:3000'] } },
  dev: {
    browserLogs: process.env.BROWSER_LOGS !== 'off',
  },
  output: { assetPrefix: 'auto', distPath: { root: 'dist' } },
  tools:
    process.env.RSDOCTOR === 'true'
      ? { rspack: { plugins: [new RsdoctorRspackPlugin({ disableClientServer: true })] } }
      : undefined,
});
