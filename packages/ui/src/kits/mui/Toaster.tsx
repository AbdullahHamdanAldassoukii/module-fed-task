import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import {
  SnackbarContent,
  SnackbarProvider,
  closeSnackbar,
  enqueueSnackbar,
  type CustomContentProps,
} from 'notistack';
import { forwardRef } from 'react';
import type { ToastFn } from '../../api';

const severity = {
  default: 'info',
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
} as const;

const ToastContent = forwardRef<HTMLDivElement, CustomContentProps>(function ToastContent(
  { id, message, variant, style, className },
  ref,
) {
  return (
    <SnackbarContent ref={ref} style={style} className={className}>
      <Alert
        severity={severity[variant]}
        variant="filled"
        role={variant === 'error' ? 'alert' : 'status'}
        onClose={() => {
          closeSnackbar(id);
        }}
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </SnackbarContent>
  );
});

const components = {
  default: ToastContent,
  info: ToastContent,
  success: ToastContent,
  warning: ToastContent,
  error: ToastContent,
};

export function Toaster() {
  return (
    <SnackbarProvider
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      maxSnack={3}
      Components={components}
    />
  );
}

export const toast: ToastFn = (message, options) => {
  const content = options?.description ? (
    <>
      <AlertTitle>{message}</AlertTitle>
      {options.description}
    </>
  ) : (
    message
  );
  enqueueSnackbar(content, { variant: options?.tone ?? 'default' });
};
