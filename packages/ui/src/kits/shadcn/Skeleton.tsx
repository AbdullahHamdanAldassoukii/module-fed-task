import type { SkeletonProps } from '../../api';
import { Skeleton as Base } from './components/ui/skeleton';

export function Skeleton({ className, height, width, label }: SkeletonProps) {
  return (
    <Base
      className={className}
      style={{ height, width }}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-busy={label ? 'true' : undefined}
    />
  );
}
