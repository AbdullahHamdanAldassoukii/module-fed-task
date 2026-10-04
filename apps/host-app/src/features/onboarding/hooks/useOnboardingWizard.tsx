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
import { initialWizardState, wizardReducer, type WizardAction, type WizardState } from '../model';

export type OnboardingState = WizardState<AppError>;
export type OnboardingAction = WizardAction<AppError>;

interface WizardContextValue {
  state: OnboardingState;
  dispatch: Dispatch<OnboardingAction>;
  /** Clears every answer and asks Step 1 to focus its first field when it shows. */
  startOver: () => void;
  /** Set by startOver until Step 1 has taken the request. */
  firstFieldFocusRequested: boolean;
  firstFieldFocusTaken: () => void;
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
  const [firstFieldFocusRequested, setFirstFieldFocusRequested] = useState(false);

  const startOver = useCallback(() => {
    setFirstFieldFocusRequested(true);
    dispatch({ type: 'reset' });
  }, []);
  const firstFieldFocusTaken = useCallback(() => setFirstFieldFocusRequested(false), []);

  const value = useMemo(
    () => ({ state, dispatch, startOver, firstFieldFocusRequested, firstFieldFocusTaken }),
    [state, startOver, firstFieldFocusRequested, firstFieldFocusTaken],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useOnboardingWizard(): WizardContextValue {
  const value = useContext(WizardContext);
  if (!value) throw new Error('useOnboardingWizard must be used inside OnboardingLayout');
  return value;
}
