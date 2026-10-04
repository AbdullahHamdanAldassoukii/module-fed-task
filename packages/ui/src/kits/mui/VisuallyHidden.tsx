import Box from '@mui/material/Box';
import type { VisuallyHiddenProps } from '../../api';

export const visuallyHidden = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
} as const;

export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return (
    <Box component="span" sx={visuallyHidden}>
      {children}
    </Box>
  );
}
