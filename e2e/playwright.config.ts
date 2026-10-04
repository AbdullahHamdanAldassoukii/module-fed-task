import { defineConfig, devices } from '@playwright/test';

const UI_KIT = process.env.UI_KIT === 'mui' ? 'mui' : 'shadcn';
const isCI = Boolean(process.env.CI);

const serverEnv = { UI_KIT, BROWSER_LOGS: 'off' };

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] }, testMatch: /smoke|i18n/ },
  ],
  webServer: [
    {
      command: 'pnpm --filter passport-form dev',
      env: serverEnv,
      url: 'http://localhost:3001/mf-manifest.json',
      reuseExistingServer: !isCI,
      timeout: 120_000,
      stderr: 'pipe',
    },
    {
      command: 'pnpm --filter host-app dev',
      env: { ...serverEnv, APP_ENV: 'development' },
      url: 'http://localhost:3000/',
      reuseExistingServer: !isCI,
      timeout: 120_000,
      stderr: 'pipe',
    },
  ],
});
