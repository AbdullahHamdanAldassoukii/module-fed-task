import { expect, test } from '@playwright/test';
import { expectNoA11yViolations } from './support/axe';

const BROKEN_CONFIGS = [
  {
    name: 'missing (404)',
    response: { status: 404, contentType: 'text/plain', body: 'Not found' },
    detail: 'Could not load /config.json',
  },
  {
    name: 'not JSON',
    response: { status: 200, contentType: 'text/html', body: '<!doctype html><p>Welcome</p>' },
    detail: 'Could not load /config.json',
  },
  {
    name: 'invalid against the schema',
    response: {
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ env: 'staging' }),
    },
    detail: 'Invalid /config.json',
  },
];

for (const { name, response, detail } of BROKEN_CONFIGS) {
  test(`config.json ${name} → an accessible configuration error page`, async ({ page }) => {
    await page.route('**/config.json', (route) => route.fulfill(response));
    await page.goto('/onboarding/passport');

    const errorPage = page.getByRole('alert');
    await expect(
      errorPage.getByRole('heading', { level: 1, name: 'Configuration error' }),
    ).toBeVisible();
    await expect(errorPage).toContainText(
      'The application could not start because its configuration is missing or invalid.',
    );
    await expect(errorPage).toContainText(detail);
    await expect(page.getByRole('navigation', { name: 'Progress' })).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await expectNoA11yViolations(page);
  });
}
