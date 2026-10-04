import { Stepper, type StepStatus } from '@repo/ui';
import { M, useT } from '../../../lib/i18n';
import { stepStatuses, type StepId } from '../model';
import { STEP_TITLE } from './stepLabels';

export function WizardStepper({ currentId }: { currentId: StepId }) {
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
        label: t(STEP_TITLE[step.id]),
        status: step.status,
      }))}
    />
  );
}
