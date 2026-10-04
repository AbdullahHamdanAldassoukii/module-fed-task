import LinearProgress from '@mui/material/LinearProgress';
import type { ProgressProps } from '../../api';

export function Progress({ value, label, className }: ProgressProps) {
  return (
    <LinearProgress
      variant={value === undefined ? 'indeterminate' : 'determinate'}
      value={value}
      aria-label={label}
      className={className}
    />
  );
}
