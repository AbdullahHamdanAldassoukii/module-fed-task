import { expect, test, type Page } from '@playwright/test';
import { expectNoA11yViolations } from './support/axe';

// MSW's service worker bypasses page.route, so routes go on the context.
const REMOTE_ORIGIN = 'http://localhost:3001/**';
const REMOTE_MANIFEST = 'http://localhost:3001/mf-manifest.json';
const REMOTE_BUDGET = { timeout: 15_000 };

const TEXT = {
  en: {
    language: 'Language',
    theme: 'Theme',
    stillLoading: 'Still loading…',
    idInfo: 'ID info',
    devPanel: 'DEV Developer panel',
    devPanelTitle: 'Developer panel',
    closeDevPanel: 'Close developer panel',
    mismatch: 'Contract mismatch',
    incompatible: 'The passport form is not compatible with this version of the app.',
  },
  ar: {
    language: 'اللغة',
    theme: 'المظهر',
    stillLoading: 'لا يزال التحميل جاريًا…',
    idInfo: 'بيانات الهوية',
    devPanel: 'تطوير لوحة المطور',
    devPanelTitle: 'لوحة المطور',
    closeDevPanel: 'إغلاق لوحة المطور',
    mismatch: 'عدم تطابق العقد',
    incompatible: 'نموذج جواز السفر غير متوافق مع هذا الإصدار من التطبيق.',
  },
} as const;

const remoteHeading = (page: Page) => page.locator('[data-passport-form-root] h2');

for (const locale of ['en', 'ar'] as const) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`${locale}, ${colorScheme}`, () => {
      const text = TEXT[locale];

      async function expectNoViolations(page: Page) {
        const html = page.locator('html');
        if (colorScheme === 'dark') await expect(html).toHaveClass(/\bdark\b/);
        else await expect(html).not.toHaveClass(/\bdark\b/);
        await expect(html).toHaveAttribute('lang', locale);

        await expectNoA11yViolations(page);
      }

      test.beforeEach(async ({ page }) => {
        await page.addInitScript((value) => {
          window.localStorage.setItem('appearance.locale', JSON.stringify(value));
        }, locale);
        await page.emulateMedia({ colorScheme });
      });

      test('passport step has no WCAG A/AA violations', async ({ page }) => {
        await page.goto('/onboarding/passport');
        await expect(remoteHeading(page)).toBeVisible();

        await expectNoViolations(page);
      });

      test('compact stepper at mobile width has no WCAG A/AA violations', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/onboarding/passport');
        await expect(remoteHeading(page)).toBeVisible();
        await expect(page.getByText(text.idInfo, { exact: true })).toHaveCSS(
          'position',
          'absolute',
        );

        await expectNoViolations(page);
      });

      test('loading state ("Still loading…") has no WCAG A/AA violations', async ({
        page,
        context,
      }) => {
        await context.route(REMOTE_MANIFEST, () => undefined);
        await page.goto('/onboarding/passport');
        await expect(page.getByText(text.stillLoading)).toBeVisible({ timeout: 6_000 });

        await expectNoViolations(page);
      });

      test('open Language menu has no WCAG A/AA violations', async ({ page }) => {
        await page.goto('/onboarding/passport');
        await expect(remoteHeading(page)).toBeVisible();
        await page.getByRole('button', { name: text.language }).click();
        await expect(page.getByRole('menu')).toBeVisible();

        await expectNoViolations(page);
      });

      test('open Theme menu has no WCAG A/AA violations', async ({ page }) => {
        await page.goto('/onboarding/passport');
        await expect(remoteHeading(page)).toBeVisible();
        await page.getByRole('button', { name: text.theme }).click();
        await expect(page.getByRole('menu')).toBeVisible();

        await expectNoViolations(page);
      });

      test('remote fallback has no WCAG A/AA violations', async ({ page, context }) => {
        await context.route(REMOTE_ORIGIN, (route) => route.abort('connectionrefused'));
        await page.goto('/onboarding/passport');
        await expect(page.getByRole('alert')).toBeVisible(REMOTE_BUDGET);

        await expectNoViolations(page);
      });

      test('contract-mismatch fallback has no WCAG A/AA violations', async ({ page }) => {
        await page.goto('/onboarding/passport');
        await expect(remoteHeading(page)).toBeVisible();
        await page.getByRole('button', { name: text.devPanel }).click();
        const panel = page.getByRole('dialog', { name: text.devPanelTitle });
        await panel.getByRole('radio', { name: text.mismatch }).check();
        await expect(page.getByRole('alert')).toContainText(text.incompatible, REMOTE_BUDGET);
        await panel.getByRole('button', { name: text.closeDevPanel }).click();
        await expect(panel).toBeHidden();

        await expectNoViolations(page);
      });

      test('not found page has no WCAG A/AA violations', async ({ page }) => {
        await page.goto('/nope');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        await expectNoViolations(page);
      });
    });
  }
}
