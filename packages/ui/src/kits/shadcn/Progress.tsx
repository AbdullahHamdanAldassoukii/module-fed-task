import { cn } from 'cn';
import type { ProgressProps } from '../../api';

export function Progress({ value, label, className }: ProgressProps) {
  const indeterminate = value === undefined;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(value)}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
    >
      <div
        className={cn('h-full bg-primary transition-all', indeterminate && 'w-1/3 animate-pulse')}
        style={indeterminate ? undefined : { width: `${value}%` }}
      />
    </div>
  );
}
