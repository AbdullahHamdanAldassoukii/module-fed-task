import MuiButton from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import type { ButtonProps } from '../../api';

const variantMap = {
  primary: 'contained',
  secondary: 'outlined',
  ghost: 'text',
  destructive: 'contained',
} as const;
const sizeMap = { sm: 'small', md: 'medium', lg: 'large' } as const;

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
    <MuiButton
      ref={buttonRef}
      type={type}
      variant={variantMap[variant]}
      color={variant === 'destructive' ? 'error' : 'primary'}
      size={sizeMap[size]}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={onClick}
      startIcon={
        loading ? <CircularProgress size={16} color="inherit" aria-hidden="true" /> : undefined
      }
      {...rest}
    >
      {children}
    </MuiButton>
  );
}
