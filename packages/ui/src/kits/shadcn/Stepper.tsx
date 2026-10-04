import { cn } from 'cn';
import { CheckIcon } from 'lucide-react';
import type { StepStatus, StepperProps } from '../../api';

const englishStatusLabels: Record<StepStatus, string> = {
  complete: 'complete',
  current: 'current',
  upcoming: 'upcoming',
};

export function Stepper({ ariaLabel, steps, statusLabels = englishStatusLabels }: StepperProps) {
  return (
    <nav aria-label={ariaLabel}>
      <ol className="flex items-center gap-3">
        {steps.map((step, index) => (
          <li
            key={step.id}
            aria-current={step.status === 'current' ? 'step' : undefined}
            className="flex items-center gap-2 text-sm"
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                step.status === 'complete' && 'border-primary bg-primary text-primary-foreground',
                step.status === 'current' && 'border-primary text-primary',
                step.status === 'upcoming' && 'border-border text-muted-foreground',
              )}
            >
              {step.status === 'complete' ? <CheckIcon className="size-4" /> : index + 1}
            </span>

            <span
              className={cn(
                step.status === 'current' ? 'font-medium' : 'max-sm:sr-only',
                step.status === 'upcoming' && 'text-muted-foreground',
              )}
            >
              {step.label}
            </span>
            <span className="sr-only">{` (${statusLabels[step.status]})`}</span>
            {index < steps.length - 1 ? (
              <span aria-hidden="true" className="mx-1 h-px w-4 bg-border sm:w-8" />
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
