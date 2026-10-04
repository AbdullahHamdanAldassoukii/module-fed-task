import { M, type AppMessageKey } from '../../../lib/i18n';
import type { WizardPageId } from '../model';

export const PAGE_TITLE = {
  passport: M.steps.passport,
  idInfo: M.steps.idInfo,
  submitted: M.submitted.title,
} satisfies Record<WizardPageId, AppMessageKey>;
