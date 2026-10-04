import { M, type AppMessageKey } from '../../../lib/i18n';
import type { StepId } from '../model';

export const STEP_TITLE = {
  passport: M.steps.passport,
  idInfo: M.steps.idInfo,
} satisfies Record<StepId, AppMessageKey>;
