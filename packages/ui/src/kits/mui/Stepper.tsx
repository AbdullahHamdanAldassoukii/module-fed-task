import Box from '@mui/material/Box';
import type { StepStatus, StepperProps } from '../../api';
import { CheckIcon } from './icons';
import { visuallyHidden } from './VisuallyHidden';

const englishStatusLabels: Record<StepStatus, string> = {
  complete: 'complete',
  current: 'current',
  upcoming: 'upcoming',
};

const circleColors = {
  complete: { borderColor: 'primary.main', bgcolor: 'primary.main', color: 'primary.contrastText' },
  current: { borderColor: 'primary.main', color: 'primary.main' },
  upcoming: { borderColor: 'divider', color: 'text.secondary' },
} as const;

export function Stepper({ ariaLabel, steps, statusLabels = englishStatusLabels }: StepperProps) {
  return (
    <nav aria-label={ariaLabel}>
      <Box
        component="ol"
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, m: 0, p: 0, listStyle: 'none' }}
      >
        {steps.map((step, index) => (
          <Box
            component="li"
            key={step.id}
            aria-current={step.status === 'current' ? 'step' : undefined}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 14 }}
          >
            <Box
              component="span"
              aria-hidden="true"
              sx={{
                display: 'flex',
                flexShrink: 0,
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: 1,
                fontSize: 12,
                fontWeight: 600,
                ...circleColors[step.status],
              }}
            >
              {step.status === 'complete' ? <CheckIcon sx={{ fontSize: 16 }} /> : index + 1}
            </Box>

            <Box
              component="span"
              sx={(theme) => ({
                fontWeight: step.status === 'current' ? 500 : undefined,
                color: step.status === 'upcoming' ? 'text.secondary' : undefined,
                [theme.breakpoints.down('sm')]: step.status === 'current' ? {} : visuallyHidden,
              })}
            >
              {step.label}
            </Box>
            <Box component="span" sx={visuallyHidden}>
              {` (${statusLabels[step.status]})`}
            </Box>
            {index < steps.length - 1 ? (
              <Box
                component="span"
                aria-hidden="true"
                sx={{ mx: 0.5, height: '1px', width: { xs: 16, sm: 32 }, bgcolor: 'divider' }}
              />
            ) : null}
          </Box>
        ))}
      </Box>
    </nav>
  );
}
