import { expect, test, type Locator } from '@playwright/test';

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`${locator.toString()} has no layout box`);
  return box;
}

// `first` comes before `second` in reading order: to its left in LTR, to its right in RTL.
async function expectReadingOrder(first: Locator, second: Locator, direction: 'ltr' | 'rtl') {
  const [a, b] = [await boxOf(first), await boxOf(second)];
  if (direction === 'ltr') expect(a.x + a.width).toBeLessThanOrEqual(b.x);
  else expect(a.x).toBeGreaterThanOrEqual(b.x + b.width);
}

test('switching to Arabic turns the host and the remote right-to-left and persists', async ({
  page,
}, testInfo) => {
  await page.goto('/onboarding/passport');
  const html = page.locator('html');
  const remoteRoot = page.locator('[data-passport-form-root]');
  await expect(remoteRoot.getByRole('heading', { name: 'Passport details' })).toBeVisible();
  await expect(html).toHaveAttribute('dir', 'ltr');
  const steps = page.getByRole('navigation', { name: 'Progress' }).getByRole('listitem');
  await expectReadingOrder(steps.first(), steps.last(), 'ltr');
  await expectReadingOrder(
    page.getByText('Complete all fields to continue'),
    page.getByRole('button', { name: 'Next' }),
    'ltr',
  );

  await page.getByRole('button', { name: 'Language' }).click();
  await page.getByRole('menuitemradio', { name: 'العربية' }).click();

  await expect(html).toHaveAttribute('dir', 'rtl');
  await expect(html).toHaveAttribute('lang', 'ar');
  await expect(remoteRoot).toHaveAttribute('dir', 'rtl');
  await expect(remoteRoot).toHaveAttribute('lang', 'ar');
  const remoteHeading = remoteRoot.getByRole('heading', { name: 'بيانات جواز السفر' });
  await expect(remoteHeading).toBeVisible();
  await expect(remoteHeading).toHaveCSS('direction', 'rtl');
  await expect(page.getByRole('heading', { level: 1, name: 'جواز السفر' })).toBeVisible();
  await expect(page).toHaveTitle('جواز السفر · معالج جواز السفر');
  await expect(page.getByRole('button', { name: 'اللغة' })).toBeVisible();
  const arabicSteps = page.getByRole('navigation', { name: 'التقدم' }).getByRole('listitem');
  await expectReadingOrder(arabicSteps.first(), arabicSteps.last(), 'rtl');
  await expectReadingOrder(
    page.getByText('أكمل جميع الحقول للمتابعة'),
    page.getByRole('button', { name: 'التالي' }),
    'rtl',
  );
  await testInfo.attach('passport-step-ar', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await page.reload();

  await expect(html).toHaveAttribute('dir', 'rtl');
  await expect(html).toHaveAttribute('lang', 'ar');
  await expect(remoteRoot).toHaveAttribute('dir', 'rtl');
  await expect(remoteHeading).toBeVisible();
});

test('choosing the dark theme darkens the host and the remote and persists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/onboarding/passport');
  const html = page.locator('html');
  const remoteRoot = page.locator('[data-passport-form-root]');
  const remoteHeading = remoteRoot.getByRole('heading', { name: 'Passport details' });
  await expect(remoteHeading).toBeVisible();
  await expect(html).not.toHaveClass(/\bdark\b/);
  const lightColor = await remoteHeading.evaluate((element) => getComputedStyle(element).color);

  await page.getByRole('button', { name: 'Theme' }).click();
  await page.getByRole('menuitemradio', { name: 'Dark' }).click();

  await expect(html).toHaveClass(/\bdark\b/);
  await expect(html).toHaveCSS('color-scheme', 'dark');
  await expect(remoteRoot).toHaveClass(/\bdark\b/);
  await expect(remoteHeading).not.toHaveCSS('color', lightColor);

  await page.reload();

  await expect(html).toHaveClass(/\bdark\b/);
  await expect(remoteRoot).toHaveClass(/\bdark\b/);
});

test('the system theme follows the operating system preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/onboarding/passport');

  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await expect(page.locator('[data-passport-form-root]')).toHaveClass(/\bdark\b/);

  await page.emulateMedia({ colorScheme: 'light' });

  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  await expect(page.locator('[data-passport-form-root]')).not.toHaveClass(/\bdark\b/);
});
