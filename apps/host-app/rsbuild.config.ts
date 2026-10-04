import fs from 'node:fs';
import path from 'node:path';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const UI_KIT = process.env.UI_KIT === 'mui' ? 'mui' : 'shadcn';
const APP_ENV = process.env.APP_ENV ?? 'development';
const REMOTE_MANIFEST_URL = 'http://localhost:3001/mf-manifest.json';

const sharedDeps = (kit: 'shadcn' | 'mui') => {
  const react = { singleton: true, strictVersion: true, requiredVersion: '^18.3.1' };
  const base = { react, 'react-dom': react };

  if (kit !== 'mui') return base;

  return {
    ...base,
    '@emotion/react': { singleton: true, requiredVersion: '^11.14.0' },
    '@emotion/styled': { singleton: true, requiredVersion: '^11.14.0' },
    '@mui/material': { requiredVersion: '^9.4.0' },
    '@mui/material/': {
      requiredVersion: '^9.4.0',
    },
    '@mui/x-date-pickers': { requiredVersion: '^9.14.0' },
    '@mui/x-date-pickers/': {
      requiredVersion: '^9.14.0',
    },
    dayjs: { requiredVersion: '^1.11.0' },
  };
};

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'host_app',
      remotes: { passport_form: `passport_form@${REMOTE_MANIFEST_URL}` },
      shared: sharedDeps(UI_KIT),
      runtimePlugins: [path.resolve(import.meta.dirname, 'src/remotes/runtime/retryPlugin.ts')],
      dts: false,
    }),
  ],
  html: {
    title: 'Passport Wizard',
    meta: { viewport: 'width=device-width, initial-scale=1' },
  },
  source: {
    entry: { index: './src/index.ts' },
    include: [path.resolve(import.meta.dirname, '../../packages')],
    define: {
      'import.meta.env.UI_KIT': JSON.stringify(UI_KIT),
      'import.meta.env.REMOTE_MANIFEST_URL': JSON.stringify(REMOTE_MANIFEST_URL),
    },
  },
  resolve: {
    aliasStrategy: 'prefer-alias',
    alias: {
      '@repo/ui$': `@repo/ui/${UI_KIT}`,
      '@app-styles': path.resolve(import.meta.dirname, `src/styles/${UI_KIT}.css`),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    setup: ({ action, server }) => {
      if (action !== 'dev') return;
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== '/config.json') return next();
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Cache-Control', 'no-store');
        response.end(fs.readFileSync(path.resolve(import.meta.dirname, `config/${APP_ENV}.json`)));
      });
    },
  },
  output: { distPath: { root: 'dist' } },
});
