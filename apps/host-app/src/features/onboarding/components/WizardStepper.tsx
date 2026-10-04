import { Stepper, type StepStatus } from '@repo/ui';
import { M, useT } from '../../../lib/i18n';
import { stepStatuses, type WizardPageId } from '../model';
import { PAGE_TITLE } from './stepLabels';

export function WizardStepper({ currentId }: { currentId: WizardPageId }) {
  const { t } = useT();

  return (
    <Stepper
      ariaLabel={t(M.steps.progress)}
      statusLabels={
        {
          complete: t(M.steps.status.complete),
          current: t(M.steps.status.current),
          upcoming: t(M.steps.status.upcoming),
        } satisfies Record<StepStatus, string>
      }
      steps={stepStatuses(currentId).map((step) => ({
        id: step.id,
        label: t(PAGE_TITLE[step.id]),
        status: step.status,
      }))}
    />
  );
}
