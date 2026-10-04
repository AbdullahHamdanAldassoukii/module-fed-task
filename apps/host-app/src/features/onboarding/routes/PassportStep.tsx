import { Button } from '@repo/ui';
import { useEffect, useState } from 'react';
import { useAppearance } from '../../../hooks/useAppearance';
import { M, useT } from '../../../lib/i18n';
import { PassportFormSlot } from '../../../remotes/passport-form';
import { useOnboardingWizard } from '../hooks/useOnboardingWizard';
import { useWizardNavigation } from '../hooks/useWizardNavigation';

const NEXT_HINT_ID = 'next-hint';

export function PassportStep() {
  const { t } = useT();
  const { state, dispatch, firstFieldFocusRequested, firstFieldFocusTaken } = useOnboardingWizard();
  const { colorScheme, locale } = useAppearance();
  const { goNext } = useWizardNavigation();
  const canProceed = state.passport.valid;
  // Read once per visit: after "Start a new application" the first field takes focus.
  const [autoFocusFirstField] = useState(firstFieldFocusRequested);

  useEffect(() => {
    if (autoFocusFirstField) firstFieldFocusTaken();
  }, [autoFocusFirstField, firstFieldFocusTaken]);

  return (
    <section className="wizard-section">
      <PassportFormSlot
        autoFocusFirstField={autoFocusFirstField}
        colorScheme={colorScheme}
        locale={locale}
        onChange={(passport) => dispatch({ type: 'passportChanged', state: passport })}
        value={state.passport.data}
      />
      <div className="wizard-actions">
        <div className="wizard-actions-end">
          {!canProceed ? (
            <p className="wizard-hint" id={NEXT_HINT_ID}>
              {t(M.wizard.completeHint)}
            </p>
          ) : null}
          <Button
            aria-describedby={canProceed ? undefined : NEXT_HINT_ID}
            disabled={!canProceed}
            onClick={goNext}
          >
            {t(M.wizard.next)}
          </Button>
        </div>
      </div>
    </section>
  );
}
