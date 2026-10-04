import { readFileSync } from 'node:fs';
import { expect, type Page, type Request } from '@playwright/test';

const isMui = process.env.UI_KIT === 'mui';

export type Locale = 'en' | 'ar';

export const PASSPORT_PDF = {
  name: 'passport.pdf',
  mimeType: 'application/pdf',
  buffer: readFileSync(new URL('../../fixtures/passport.pdf', import.meta.url)),
};

/** The assessment's example application. */
export const EXAMPLE = {
  passport: {
    passportNumber: 'A1234567',
    firstName: 'Ali',
    lastName: 'Hassan',
    issueDate: '2024-01-15',
    expiryDate: '2034-01-14',
  },
  idInfo: { idNumber: '784-1234-5678901-2', nationality: 'AE' },
} as const;

/** The labels the tests press or look for, as each locale shows them. */
export const TEXT = {
  en: {
    next: 'Next',
    back: 'Back',
    submit: 'Submit',
    tryAgain: 'Try again',
    idInfoTitle: 'ID info',
    submittedTitle: 'Application submitted',
    failedTitle: "We couldn't submit your application.",
    startNew: 'Start a new application',
    confirmTitle: 'Start a new application?',
    confirmStart: 'Start new',
    nationality: 'Nationality',
    nationalityName: 'United Arab Emirates',
    devPanel: 'DEV Developer panel',
    devPanelTitle: 'Developer panel',
    closeDevPanel: 'Close developer panel',
    success: 'Success',
    serverError: 'Server error (500)',
  },
  ar: {
    next: 'التالي',
    back: 'رجوع',
    submit: 'إرسال',
    tryAgain: 'حاول مرة أخرى',
    idInfoTitle: 'بيانات الهوية',
    submittedTitle: 'تم إرسال الطلب',
    failedTitle: 'تعذر إرسال طلبك.',
    startNew: 'بدء طلب جديد',
    confirmTitle: 'بدء طلب جديد؟',
    confirmStart: 'بدء من جديد',
    nationality: 'الجنسية',
    nationalityName: 'الإمارات العربية المتحدة',
    devPanel: 'تطوير لوحة المطور',
    devPanelTitle: 'لوحة المطور',
    closeDevPanel: 'إغلاق لوحة المطور',
    success: 'نجاح',
    serverError: 'خطأ في الخادم (500)',
  },
} as const;

export const remoteRoot = (page: Page) => page.locator('[data-passport-form-root]');

/** The remote's fields, by the ids its team publishes with the contract. */
export const passportField = {
  passportNumber: (page: Page) => page.locator('#pf-passport-number'),
  firstName: (page: Page) => page.locator('#pf-first-name'),
  lastName: (page: Page) => page.locator('#pf-last-name'),
  issueDate: (page: Page) => page.locator('#pf-issue-date'),
  expiryDate: (page: Page) => page.locator('#pf-expiry-date'),
  documentInput: (page: Page) => page.locator('#pf-document-input'),
};

export const idNumberField = (page: Page) => page.locator('#id-number');
export const nationalityField = (page: Page) => page.locator('#nationality');

export const documentChip = (page: Page) =>
  remoteRoot(page).getByText(PASSPORT_PDF.name, { exact: true });

async function fillDate(page: Page, field: 'issueDate' | 'expiryDate', isoDate: string) {
  const input = passportField[field](page);
  if (!isMui) {
    await input.fill(isoDate);
    return;
  }
  // MUI shows the date as year, month and day parts; focusing the field selects the first part,
  // and typing the digits moves through the parts.
  await input.focus();
  await page.keyboard.type(isoDate.replaceAll('-', ''));
  await expect(input).toHaveValue(isoDate);
}

/** Fills Step 1 with the example passport and the PDF, and waits until Next is enabled. */
export async function fillPassportStep(page: Page, text: (typeof TEXT)[Locale] = TEXT.en) {
  const { passport } = EXAMPLE;
  await expect(passportField.passportNumber(page)).toBeVisible({ timeout: 15_000 });
  await passportField.passportNumber(page).fill(passport.passportNumber);
  await passportField.firstName(page).fill(passport.firstName);
  await passportField.lastName(page).fill(passport.lastName);
  await fillDate(page, 'issueDate', passport.issueDate);
  await fillDate(page, 'expiryDate', passport.expiryDate);
  await passportField.documentInput(page).setInputFiles(PASSPORT_PDF);
  await expect(documentChip(page)).toBeVisible();
  await expect(page.getByRole('button', { name: text.next, exact: true })).toBeEnabled();
}

/** Fills Step 2 with the example ID number, typed as digits, and the example nationality. */
export async function fillIdInfoStep(page: Page, text: (typeof TEXT)[Locale] = TEXT.en) {
  await idNumberField(page).pressSequentially(EXAMPLE.idInfo.idNumber.replaceAll('-', ''));
  await expect(idNumberField(page)).toHaveValue(EXAMPLE.idInfo.idNumber);
  await page.getByRole('combobox', { name: text.nationality }).click();
  await page.getByRole('option', { name: text.nationalityName, exact: true }).click();
  await expect(nationalityField(page)).toContainText(text.nationalityName);
}

export async function expectPassportStepRestored(page: Page) {
  const { passport } = EXAMPLE;
  await expect(passportField.passportNumber(page)).toHaveValue(passport.passportNumber, {
    timeout: 15_000,
  });
  await expect(passportField.firstName(page)).toHaveValue(passport.firstName);
  await expect(passportField.lastName(page)).toHaveValue(passport.lastName);
  await expect(passportField.issueDate(page)).toHaveValue(passport.issueDate);
  await expect(passportField.expiryDate(page)).toHaveValue(passport.expiryDate);
  await expect(documentChip(page)).toBeVisible();
}

export async function expectIdInfoStepRestored(page: Page, text: (typeof TEXT)[Locale] = TEXT.en) {
  await expect(idNumberField(page)).toHaveValue(EXAMPLE.idInfo.idNumber);
  await expect(nationalityField(page)).toContainText(text.nationalityName);
}

export const isApplicationPost = (request: Request) =>
  request.method() === 'POST' && new URL(request.url()).pathname === '/api/applications';

/** Picks an API scenario in the developer panel (the mock answers by this header). */
export async function chooseApiScenario(
  page: Page,
  scenario: 'success' | 'serverError',
  text: (typeof TEXT)[Locale] = TEXT.en,
) {
  await page.getByRole('button', { name: text.devPanel }).click();
  const panel = page.getByRole('dialog', { name: text.devPanelTitle });
  await panel.getByRole('radio', { name: text[scenario] }).check();
  await panel.getByRole('button', { name: text.closeDevPanel }).click();
  await expect(panel).toBeHidden();
}

/**
 * Seeds the draft a refresh on Step 2 would restore: the example passport and ID, so a test can
 * start on Step 2 in any language.
 */
export async function seedStepTwoDraft(page: Page) {
  const draft = {
    passport: {
      ...EXAMPLE.passport,
      document: {
        fileName: PASSPORT_PDF.name,
        mimeType: PASSPORT_PDF.mimeType,
        base64: PASSPORT_PDF.buffer.toString('base64'),
      },
    },
    idInfo: EXAMPLE.idInfo,
  };
  await page.addInitScript((value) => {
    if (window.sessionStorage.getItem('onboarding.draft.v1') === null) {
      window.sessionStorage.setItem('onboarding.draft.v1', value);
    }
  }, JSON.stringify(draft));
}
