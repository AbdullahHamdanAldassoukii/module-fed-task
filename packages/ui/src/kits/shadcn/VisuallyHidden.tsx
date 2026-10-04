import type { VisuallyHiddenProps } from '../../api';

export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return <span className="sr-only">{children}</span>;
}
