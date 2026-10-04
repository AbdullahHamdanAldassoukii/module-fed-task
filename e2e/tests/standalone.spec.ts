import { expect, test } from '@playwright/test';

test('the remote runs on its own page and shows what it reports', async ({ page }) => {
  await page.goto('http://localhost:3001/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Passport Form — standalone harness' }),
  ).toBeVisible();
  const remoteRoot = page.locator('[data-passport-form-root]');
  await expect(remoteRoot.getByRole('heading', { name: 'Passport details' })).toBeVisible();
  await expect(page.getByTestId('reported-valid')).toHaveText('(invalid)');

  await page.getByRole('button', { name: /^Language/ }).click();

  await expect(remoteRoot).toHaveAttribute('dir', 'rtl');
  await expect(remoteRoot).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).not.toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).not.toHaveAttribute('lang', 'ar');
  await expect(remoteRoot.getByRole('heading', { name: 'بيانات جواز السفر' })).toBeVisible();
  await expect(page.getByTestId('reported-valid')).toHaveText('(غير صالح)');
});
