import { expect, test, type Page } from '@playwright/test';
import { expectNoA11yViolations } from './support/axe';
import {
  EXAMPLE,
  PASSPORT_PDF,
  TEXT,
  chooseApiScenario,
  documentChip,
  expectIdInfoStepRestored,
  expectPassportStepRestored,
  fillIdInfoStep,
  fillPassportStep,
  idNumberField,
  isApplicationPost,
  seedStepTwoDraft,
  type Locale,
} from './support/wizard';

const REFERENCE = /^APP-[A-Z0-9]{6}$/;

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });

async function goToStepTwo(page: Page) {
  await page.goto('/onboarding/passport');
  await fillPassportStep(page);
  await button(page, TEXT.en.next).click();
  await expect(page).toHaveURL(/\/onboarding\/id-info$/);
  await expect(heading(page, TEXT.en.idInfoTitle)).toBeVisible();
}

test('the example application goes through both steps and is submitted in the exact shape', async ({
  page,
}) => {
  await goToStepTwo(page);
  const submit = button(page, TEXT.en.submit);
  await expect(submit).toBeDisabled();
  await expect(submit).toHaveAccessibleDescription('Complete all fields to submit');

  await fillIdInfoStep(page);
  await expect(submit).toBeEnabled();
  const submitted = page.waitForRequest(isApplicationPost);
  await submit.click();
  const request = await submitted;

  const payload = request.postDataJSON() as {
    passport: Record<string, unknown> & { document: Record<string, unknown> };
    idInfo: Record<string, unknown>;
  };
  expect(Object.keys(payload)).toEqual(['passport', 'idInfo']);
  expect(Object.keys(payload.passport)).toEqual([
    'passportNumber',
    'firstName',
    'lastName',
    'issueDate',
    'expiryDate',
    'document',
  ]);
  expect(Object.keys(payload.passport.document)).toEqual(['fileName', 'mimeType', 'base64']);
  expect(Object.keys(payload.idInfo)).toEqual(['idNumber', 'nationality']);
  expect(payload).toEqual({
    passport: {
      ...EXAMPLE.passport,
      document: {
        fileName: PASSPORT_PDF.name,
        mimeType: PASSPORT_PDF.mimeType,
        base64: PASSPORT_PDF.buffer.toString('base64'),
      },
    },
    idInfo: EXAMPLE.idInfo,
  });
  expect(request.headers()['idempotency-key']).toMatch(/^[0-9a-f-]{36}$/);

  await expect(page).toHaveURL(/\/onboarding\/submitted$/);
  await expect(heading(page, TEXT.en.submittedTitle)).toBeFocused();
  await expect(page.getByText(REFERENCE)).toBeVisible();
  const summary = page.getByRole('region', { name: 'Summary' });
  await expect(summary).toContainText('Ali Hassan');
  await expect(summary).toContainText('A1234567');
  await expect(summary).toContainText('784-1234-5678901-2');
  await expect(summary).toContainText('United Arab Emirates');
  await expect(summary).toContainText('passport.pdf');
});

test('Enter in a field submits Step 2 once it is complete', async ({ page }) => {
  await goToStepTwo(page);
  await fillIdInfoStep(page);

  const submitted = page.waitForRequest(isApplicationPost);
  await idNumberField(page).press('Enter');
  await submitted;

  await expect(heading(page, TEXT.en.submittedTitle)).toBeVisible();
});

test('Back keeps the answers on both steps', async ({ page }) => {
  await goToStepTwo(page);
  await fillIdInfoStep(page);

  await button(page, TEXT.en.back).click();

  await expect(page).toHaveURL(/\/onboarding\/passport$/);
  await expectPassportStepRestored(page);
  await expect(button(page, TEXT.en.next)).toBeEnabled();

  await button(page, TEXT.en.next).click();

  await expect(page).toHaveURL(/\/onboarding\/id-info$/);
  await expectIdInfoStepRestored(page);
  await expect(button(page, TEXT.en.submit)).toBeEnabled();
});

test('a refresh keeps the answers on both steps, including the document', async ({ page }) => {
  await page.goto('/onboarding/passport');
  await fillPassportStep(page);

  await page.reload();

  await expectPassportStepRestored(page);
  await expect(button(page, TEXT.en.next)).toBeEnabled();
  await button(page, TEXT.en.next).click();
  await fillIdInfoStep(page);

  await page.reload();

  await expect(page).toHaveURL(/\/onboarding\/id-info$/);
  await expect(heading(page, TEXT.en.idInfoTitle)).toBeVisible();
  await expectIdInfoStepRestored(page);
  await expect(button(page, TEXT.en.submit)).toBeEnabled();
  await button(page, TEXT.en.back).click();
  await expectPassportStepRestored(page);
});

test('a refresh on the confirmation keeps the reference and leaves the answers out', async ({
  page,
}) => {
  await goToStepTwo(page);
  await fillIdInfoStep(page);
  await button(page, TEXT.en.submit).click();
  await expect(heading(page, TEXT.en.submittedTitle)).toBeVisible();
  const reference = (await page.getByText(REFERENCE).textContent()) ?? '';
  expect(reference).toMatch(REFERENCE);

  await page.reload();

  await expect(page).toHaveURL(/\/onboarding\/submitted$/);
  await expect(heading(page, TEXT.en.submittedTitle)).toBeVisible();
  await expect(page.getByText(reference, { exact: true })).toBeVisible();
  await expect(page.getByText("The summary isn't kept after a refresh")).toBeVisible();
  await expect(page.getByRole('region', { name: 'Summary' })).toHaveCount(0);

  await button(page, TEXT.en.startNew).click();
  const dialog = page.getByRole('alertdialog', { name: TEXT.en.confirmTitle });
  await expect(dialog).toContainText(reference);
  await dialog.getByRole('button', { name: TEXT.en.confirmStart }).click();
  await expect(page).toHaveURL(/\/onboarding\/passport$/);
  await expect(page.locator('#pf-passport-number')).toBeFocused({ timeout: 15_000 });
  await expect(page.locator('#pf-passport-number')).toHaveValue('');
  await expect(documentChip(page)).toHaveCount(0);
});

test('a server error keeps the answers, and Try again sends the same request and succeeds', async ({
  page,
}) => {
  await goToStepTwo(page);
  await fillIdInfoStep(page);
  await chooseApiScenario(page, 'serverError');

  const failedRequest = page.waitForRequest(isApplicationPost);
  await button(page, TEXT.en.submit).click();
  const failedKey = (await failedRequest).headers()['idempotency-key'];

  const alert = page.getByRole('alert').filter({ hasText: TEXT.en.failedTitle });
  await expect(alert).toBeVisible();
  await expect(alert).toContainText('Your information is still here.');
  await expect(page).toHaveURL(/\/onboarding\/id-info$/);
  await expectIdInfoStepRestored(page);

  await chooseApiScenario(page, 'success');
  const retriedRequest = page.waitForRequest(isApplicationPost);
  await alert.getByRole('button', { name: TEXT.en.tryAgain }).click();
  expect((await retriedRequest).headers()['idempotency-key']).toBe(failedKey);

  await expect(heading(page, TEXT.en.submittedTitle)).toBeVisible();
  await expect(page.getByText(REFERENCE)).toBeVisible();
});

for (const locale of ['en', 'ar'] as const satisfies readonly Locale[]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${locale}, ${colorScheme}: Step 2, the failure alert, the confirmation and the start-over dialog have no WCAG A/AA violations`, async ({
      page,
    }) => {
      const text = TEXT[locale];
      await page.addInitScript((value) => {
        window.localStorage.setItem('appearance.locale', JSON.stringify(value));
      }, locale);
      await page.emulateMedia({ colorScheme });
      await seedStepTwoDraft(page);
      await page.goto('/onboarding/id-info');
      const html = page.locator('html');
      await expect(html).toHaveAttribute('lang', locale);
      if (colorScheme === 'dark') await expect(html).toHaveClass(/\bdark\b/);
      else await expect(html).not.toHaveClass(/\bdark\b/);
      await expect(heading(page, text.idInfoTitle)).toBeVisible();
      await expect(button(page, text.submit)).toBeEnabled();

      await expectNoA11yViolations(page);

      await chooseApiScenario(page, 'serverError', text);
      await button(page, text.submit).click();
      await expect(page.getByRole('alert').filter({ hasText: text.failedTitle })).toBeVisible();

      await expectNoA11yViolations(page);

      await chooseApiScenario(page, 'success', text);
      await button(page, text.tryAgain).click();
      await expect(heading(page, text.submittedTitle)).toBeVisible();

      await expectNoA11yViolations(page);

      await button(page, text.startNew).click();
      await expect(page.getByRole('alertdialog', { name: text.confirmTitle })).toBeVisible();

      await expectNoA11yViolations(page);
    });
  }
}
