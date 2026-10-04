import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import type { ReactNode } from 'react';
import { fieldLabelId } from '../../shared/fieldAria';
import { visuallyHidden } from './VisuallyHidden';

export { fieldAria, fieldLabelId } from '../../shared/fieldAria';

export interface FieldShellProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  labelFor?: string;
}

export function FieldShell({
  id,
  label,
  description,
  error,
  required,
  children,
  labelFor = id,
}: FieldShellProps) {
  return (
    <FormControl fullWidth error={Boolean(error)} sx={{ gap: 0.75 }}>
      <FormLabel
        id={fieldLabelId(id)}
        htmlFor={labelFor}
        required={required}
        sx={{
          fontSize: 14,
          fontWeight: 500,
          color: 'text.primary',
          '&.Mui-focused, &.Mui-error': { color: 'text.primary' },
          '& .MuiFormLabel-asterisk': { color: 'error.main' },
        }}
      >
        {label}
      </FormLabel>
      {description ? (
        <FormHelperText id={`${id}-description`} error={false} sx={{ m: 0 }}>
          {description}
        </FormHelperText>
      ) : null}
      {children}

      <FormHelperText
        id={`${id}-error`}
        aria-live="polite"
        sx={error ? { m: 0, minHeight: 16 } : visuallyHidden}
      >
        {error ?? ''}
      </FormHelperText>
    </FormControl>
  );
}
