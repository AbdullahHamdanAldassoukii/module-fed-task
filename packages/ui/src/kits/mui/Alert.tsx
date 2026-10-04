import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import type { AlertProps } from '../../api';

export function Alert({ tone, title, children, actions, role, className }: AlertProps) {
  return (
    <MuiAlert
      severity={tone}
      variant="outlined"
      role={role ?? (tone === 'error' ? 'alert' : 'status')}
      className={className}
    >
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <div>{children}</div>
      {actions ? (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>{actions}</Box>
      ) : null}
    </MuiAlert>
  );
}
