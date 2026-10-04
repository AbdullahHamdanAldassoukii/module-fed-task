import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { initialWizardState, wizardReducer, type WizardAction, type WizardState } from '../model';

interface WizardContextValue {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({
  children,
  initialState = initialWizardState,
}: {
  children: ReactNode;
  initialState?: WizardState;
}) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useOnboardingWizard(): WizardContextValue {
  const value = useContext(WizardContext);
  if (!value) throw new Error('useOnboardingWizard must be used inside OnboardingLayout');
  return value;
}
