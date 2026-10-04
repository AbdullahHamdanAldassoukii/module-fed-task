import { cn } from 'cn';
import type { ReactNode } from 'react';
import { fieldLabelId } from '../../shared/fieldAria';
import { Label } from './components/ui/label';

export { fieldAria, fieldLabelId } from '../../shared/fieldAria';

export interface FieldShellProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  labelFor?: string;
  className?: string;
}

export function FieldShell({
  id,
  label,
  description,
  error,
  required,
  children,
  labelFor = id,
  className,
}: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)} data-slot="field">
      <Label id={fieldLabelId(id)} htmlFor={labelFor} className="text-sm font-medium">
        {label}
        {required ? (
          <span aria-hidden="true" className="ms-0.5 text-destructive">
            *
          </span>
        ) : null}
      </Label>
      {description ? (
        <p id={`${id}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children}

      <p
        id={`${id}-error`}
        aria-live="polite"
        className={cn('min-h-4 text-xs text-destructive', !error && 'sr-only')}
      >
        {error ?? ''}
      </p>
    </div>
  );
}
