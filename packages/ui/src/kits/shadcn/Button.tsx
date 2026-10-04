import { LoaderCircleIcon } from 'lucide-react';
import type { ButtonProps } from '../../api';
import { Button as Base } from './components/ui/button';

const variantMap = {
  primary: 'default',
  secondary: 'outline',
  ghost: 'ghost',
  destructive: 'destructive',
} as const;
const sizeMap = { sm: 'sm', md: 'default', lg: 'lg' } as const;

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  buttonRef,
  ...rest
}: ButtonProps) {
  return (
    <Base
      ref={buttonRef}
      type={type}
      variant={variantMap[variant]}
      size={sizeMap[size]}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={onClick}
      {...rest}
    >
      {loading ? <LoaderCircleIcon className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </Base>
  );
}
