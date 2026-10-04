import { expect, test, type Page } from '@playwright/test';

interface SharedCopy {
  name: string;
  version: string;
  from: string | undefined;
  useIn: string[];
}

function loadedSharedCopies(page: Page, names: string[]): Promise<SharedCopy[]> {
  return page.evaluate((packageNames) => {
    interface ShareInfo {
      loaded?: boolean;
      from?: string;
      useIn?: string[];
    }
    type ShareScopes = Record<string, Record<string, Record<string, ShareInfo>>>;
    const federation = (
      globalThis as { __FEDERATION__?: { __SHARE__?: Record<string, ShareScopes> } }
    ).__FEDERATION__;
    const copies = new Map<string, SharedCopy>();

    for (const scopes of Object.values(federation?.__SHARE__ ?? {})) {
      for (const packages of Object.values(scopes)) {
        for (const name of packageNames) {
          for (const [version, info] of Object.entries(packages[name] ?? {})) {
            if (!info.loaded) continue;
            // Key by provider so a second copy is not merged into the host's.
            const key = `${name}@${version} from ${info.from ?? '?'}`;
            const useIn = new Set([...(copies.get(key)?.useIn ?? []), ...(info.useIn ?? [])]);
            copies.set(key, { name, version, from: info.from, useIn: [...useIn].sort() });
          }
        }
      }
    }
    return [...copies.values()];
  }, names);
}

test('host loads, renders the federated passport form, and keeps Next disabled with a hint', async ({
  page,
}) => {
  const reactErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && /Invalid hook call|copies of React/i.test(message.text())) {
      reactErrors.push(message.text());
    }
  });
  const remoteManifest = page.waitForResponse(
    (response) => response.url() === 'http://localhost:3001/mf-manifest.json' && response.ok(),
  );

  await page.goto('/');

  await expect(page).toHaveURL(/\/onboarding\/passport$/);
  await expect(page).toHaveTitle('Passport · Passport Wizard');
  await expect(page.getByRole('banner')).toContainText('Passport Wizard');
  const progress = page.getByRole('navigation', { name: 'Progress' });
  await expect(progress).toBeVisible();
  await expect(progress.getByRole('listitem')).toHaveCount(2);
  await expect(progress.locator('[aria-current="step"]')).toContainText('Passport');
  await expect(page.getByRole('heading', { level: 1, name: 'Passport' })).toBeVisible();

  await remoteManifest;
  const remoteRoot = page.locator('[data-passport-form-root]');
  await expect(remoteRoot.getByRole('heading', { name: 'Passport details' })).toBeVisible();
  await expect(remoteRoot).toHaveAttribute('dir', 'ltr');
  await expect(remoteRoot).toHaveAttribute('lang', 'en');

  const next = page.getByRole('button', { name: 'Next' });
  await expect(next).toBeDisabled();
  await expect(page.getByText('Complete all fields to continue')).toBeVisible();
  await expect(next).toHaveAccessibleDescription('Complete all fields to continue');

  expect(reactErrors).toEqual([]);
});

test('host and remote share one copy of each singleton, provided by the host', async ({ page }) => {
  const singletons = [
    'react',
    'react-dom',
    ...(process.env.UI_KIT === 'mui' ? ['@emotion/react'] : []),
  ].sort();
  await page.goto('/onboarding/passport');
  await expect(page.locator('[data-passport-form-root]')).toBeVisible();

  const copies = await loadedSharedCopies(page, singletons);

  expect(copies.sort((left, right) => (left.name < right.name ? -1 : 1))).toEqual(
    singletons.map((name) =>
      expect.objectContaining({ name, from: 'host_app', useIn: ['host_app', 'passport_form'] }),
    ),
  );
});

test('direct visit to step 2 redirects to step 1', async ({ page }) => {
  await page.goto('/onboarding/id-info');

  await expect(page).toHaveURL(/\/onboarding\/passport$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Passport' })).toBeVisible();
});

test('unknown route shows not found with a way back to the start', async ({ page }) => {
  await page.goto('/nope');

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page).toHaveTitle('Page not found · Passport Wizard');
  await page.getByRole('link', { name: 'Go to the start' }).click();
  await expect(page).toHaveURL(/\/onboarding\/passport$/);
});

test('serves the UI kit this run asked for', async ({ page }) => {
  const muiExpected = process.env.UI_KIT === 'mui';
  await page.goto('/onboarding/passport');

  const next = page.getByRole('button', { name: 'Next' });
  await expect(next).toBeVisible();
  expect(((await next.getAttribute('class')) ?? '').includes('MuiButton-root')).toBe(muiExpected);
});
