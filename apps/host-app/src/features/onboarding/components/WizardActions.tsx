import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export const WizardActionsSlot = createContext<HTMLElement | null>(null);

interface WizardActionsProps {
  children: ReactNode;
  hintId?: string;
  hint?: string | null;
}

export function WizardActions({ children, hintId, hint }: WizardActionsProps) {
  const slot = useContext(WizardActionsSlot);
  if (!slot) return null;

  return createPortal(
    <>
      <div className="wizard-actions">{children}</div>
      {hintId ? (
        <p className="wizard-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </>,
    slot,
  );
}
