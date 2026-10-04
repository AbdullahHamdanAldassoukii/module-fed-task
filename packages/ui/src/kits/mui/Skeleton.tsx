import MuiSkeleton from '@mui/material/Skeleton';
import type { SkeletonProps } from '../../api';

export function Skeleton({ className, height, width, label }: SkeletonProps) {
  return (
    <MuiSkeleton
      variant="rounded"
      className={className}
      height={height}
      width={width}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-busy={label ? 'true' : undefined}
    />
  );
}
