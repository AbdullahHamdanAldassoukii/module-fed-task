import { cn } from 'cn';
import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react';
import type { AlertProps } from '../../api';
import { Alert as Base, AlertDescription, AlertTitle } from './components/ui/alert';

const icons = {
  info: InfoIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
  error: CircleAlertIcon,
} as const;
const tones = {
  info: 'border-primary/30 text-foreground',
  success: 'border-success/40 text-foreground *:[svg]:text-success',
  warning: 'border-warning/40 text-foreground *:[svg]:text-warning',
  error: 'border-destructive/40',
} as const;

export function Alert({ tone, title, children, actions, role, className }: AlertProps) {
  const Icon = icons[tone];
  return (
    <Base
      role={role ?? (tone === 'error' ? 'alert' : 'status')}
      variant={tone === 'error' ? 'destructive' : 'default'}
      className={cn(tones[tone], className)}
    >
      <Icon aria-hidden="true" />
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription>
        <div>{children}</div>
        {actions ? <div className="mt-2 flex flex-wrap gap-2">{actions}</div> : null}
      </AlertDescription>
    </Base>
  );
}
