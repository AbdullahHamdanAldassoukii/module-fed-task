import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';
import type { AppError } from '../../../lib/errors';
import {
  initialWizardState,
  wizardReducer,
  type PassportField,
  type WizardAction,
  type WizardState,
} from '../model';

export type OnboardingState = WizardState<AppError>;
export type OnboardingAction = WizardAction<AppError>;
export type PassportFocusTarget = 'firstField' | PassportField;

interface WizardContextValue {
  state: OnboardingState;
  dispatch: Dispatch<OnboardingAction>;
  startOver: () => void;
  requestPassportFocus: (target: PassportFocusTarget) => void;
  passportFocus: PassportFocusTarget | null;
  passportFocusTaken: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({
  children,
  initialState = initialWizardState,
}: {
  children: ReactNode;
  initialState?: OnboardingState;
}) {
  const [state, dispatch] = useReducer(wizardReducer<AppError>, initialState);
  const [passportFocus, setPassportFocus] = useState<PassportFocusTarget | null>(null);

  const startOver = useCallback(() => {
    setPassportFocus('firstField');
    dispatch({ type: 'reset' });
  }, []);
  const passportFocusTaken = useCallback(() => setPassportFocus(null), []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      startOver,
      requestPassportFocus: setPassportFocus,
      passportFocus,
      passportFocusTaken,
    }),
    [state, startOver, passportFocus, passportFocusTaken],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useOnboardingWizard(): WizardContextValue {
  const value = useContext(WizardContext);
  if (!value) throw new Error('useOnboardingWizard must be used inside OnboardingLayout');
  return value;
}
