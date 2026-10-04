import { expect, test, type Page } from '@playwright/test';

// MSW's service worker bypasses page.route, so routes go on the context.
const REMOTE_ORIGIN = 'http://localhost:3001/**';
const REMOTE_MANIFEST = 'http://localhost:3001/mf-manifest.json';

const FALLBACK_BUDGET = { timeout: 15_000 };
const LOAD_TIMEOUT_MS = 15_000;
const TIMEOUT_SLACK_MS = 2_000;

const remoteHeading = (page: Page, name = 'Passport details') =>
  page.locator('[data-passport-form-root]').getByRole('heading', { name });

test('remote unreachable → fallback with Try again; recovers when the remote is back', async ({
  page,
  context,
}) => {
  await context.route(REMOTE_ORIGIN, (route) => route.abort('connectionrefused'));
  await page.goto('/onboarding/passport');

  const alert = page.getByRole('alert');
  await expect(alert).toContainText("The passport form couldn't load", FALLBACK_BUDGET);
  await expect(alert).toContainText('Please try again. Your information is kept.');
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
  await expect(page.getByRole('navigation', { name: 'Progress' })).toBeVisible();
  await page.getByRole('button', { name: 'Language' }).click();
  await page.getByRole('menuitemradio', { name: 'العربية' }).click();
  await expect(alert).toContainText('تعذر تحميل نموذج جواز السفر');

  await context.unroute(REMOTE_ORIGIN);
  await page.getByRole('button', { name: 'حاول مرة أخرى' }).click();

  const remoteRoot = page.locator('[data-passport-form-root]');
  await expect(remoteHeading(page, 'بيانات جواز السفر')).toBeVisible(FALLBACK_BUDGET);
  await expect(remoteRoot).toHaveAttribute('dir', 'rtl');
  await expect(alert).toHaveCount(0);
});

test('slow remote shows a labelled skeleton, then "Still loading…", then the form', async ({
  page,
  context,
}) => {
  let releaseManifest: () => void = () => undefined;
  const manifestReleased = new Promise<void>((resolve) => {
    releaseManifest = resolve;
  });
  await context.route(REMOTE_MANIFEST, async (route) => {
    await manifestReleased;
    await route.continue();
  });
  await page.goto('/onboarding/passport');

  const next = page.getByRole('button', { name: 'Next' });
  await expect(page.getByRole('status', { name: 'Loading passport form…' })).toBeVisible();
  await expect(next).toBeDisabled();
  await expect(page.getByText('Still loading…')).toBeVisible({ timeout: 6_000 });
  await expect(next).toBeDisabled();
  releaseManifest();

  await expect(remoteHeading(page)).toBeVisible(FALLBACK_BUDGET);
  await expect(page.getByText('Still loading…')).toHaveCount(0);
  await expect(next).toBeDisabled();
});

test('hung remote: the fallback replaces the skeleton after the load timeout; Try again recovers', async ({
  page,
  context,
}) => {
  test.setTimeout(45_000);
  // The runtime caches a pending manifest request; only re-registering the remote recovers.
  await context.route(REMOTE_MANIFEST, () => undefined);
  await page.goto('/onboarding/passport');

  const next = page.getByRole('button', { name: 'Next' });
  await expect(page.getByRole('status', { name: 'Loading passport form…' })).toBeVisible();
  const skeletonShownAt = Date.now();
  await expect(next).toBeDisabled();
  await expect(page.getByText('Still loading…')).toBeVisible({ timeout: 6_000 });

  const alert = page.getByRole('alert');
  await expect(alert).toContainText("The passport form couldn't load", {
    timeout: LOAD_TIMEOUT_MS + TIMEOUT_SLACK_MS,
  });
  expect(Date.now() - skeletonShownAt).toBeGreaterThan(LOAD_TIMEOUT_MS - TIMEOUT_SLACK_MS);
  await expect(page.getByRole('status', { name: 'Loading passport form…' })).toHaveCount(0);
  await expect(next).toBeDisabled();

  await context.unroute(REMOTE_MANIFEST);
  await page.getByRole('button', { name: 'Try again' }).click();

  await expect(remoteHeading(page)).toBeVisible(FALLBACK_BUDGET);
  await expect(alert).toHaveCount(0);
});

test('the developer panel takes a loaded remote down and Normal brings it back', async ({
  page,
}) => {
  await page.goto('/onboarding/passport');
  await expect(remoteHeading(page)).toBeVisible();

  await page.getByRole('button', { name: 'DEV Developer panel' }).click();
  const panel = page.getByRole('dialog', { name: 'Developer panel' });
  await panel.getByRole('radio', { name: 'Down' }).check();

  await expect(page.getByRole('alert')).toContainText(
    "The passport form couldn't load",
    FALLBACK_BUDGET,
  );
  await expect(remoteHeading(page)).toHaveCount(0);

  await panel.getByRole('radio', { name: 'Normal' }).check();
  await panel.getByRole('button', { name: 'Close developer panel' }).click();
  await expect(panel).toBeHidden();

  await expect(remoteHeading(page)).toBeVisible(FALLBACK_BUDGET);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('a remote with an incompatible contract shows its own fallback without Try again; Normal recovers', async ({
  page,
}) => {
  await page.goto('/onboarding/passport');
  await expect(remoteHeading(page)).toBeVisible();

  await page.getByRole('button', { name: 'DEV Developer panel' }).click();
  const panel = page.getByRole('dialog', { name: 'Developer panel' });
  await panel.getByRole('radio', { name: 'Contract mismatch' }).check();

  const alert = page.getByRole('alert');
  await expect(alert).toContainText("The passport form couldn't load", FALLBACK_BUDGET);
  await expect(alert).toContainText(
    'The passport form is not compatible with this version of the app.',
  );
  await expect(alert).not.toContainText('Please try again.');
  await expect(alert.getByRole('button', { name: 'Try again' })).toHaveCount(0);
  await expect(remoteHeading(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();

  await panel.getByRole('radio', { name: 'Normal' }).check();
  await panel.getByRole('button', { name: 'Close developer panel' }).click();
  await expect(panel).toBeHidden();

  await expect(remoteHeading(page)).toBeVisible(FALLBACK_BUDGET);
  await expect(alert).toHaveCount(0);
});
