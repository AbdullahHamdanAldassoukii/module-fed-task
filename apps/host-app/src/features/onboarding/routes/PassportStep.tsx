import { Button } from '@repo/ui';
import { PassportFormSlot } from '../../../remotes/passport-form';
import { useAppearance } from '../../../hooks/useAppearance';
import { M, useT } from '../../../lib/i18n';
import { useOnboardingWizard } from '../hooks/useOnboardingWizard';
import { useWizardNavigation } from '../hooks/useWizardNavigation';

export function PassportStep() {
  const { t } = useT();
  const { state, dispatch } = useOnboardingWizard();
  const { colorScheme, locale } = useAppearance();
  const { goNext } = useWizardNavigation();
  const canProceed = state.passport.valid;

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <PassportFormSlot
        colorScheme={colorScheme}
        locale={locale}
        onChange={(passport) => dispatch({ type: 'passportChanged', state: passport })}
        value={state.passport.data}
      />
      <div style={{ alignItems: 'center', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        {!canProceed ? (
          <span id="next-hint" style={{ fontSize: 13, opacity: 0.8 }}>
            {t(M.wizard.completeHint)}
          </span>
        ) : null}
        <Button
          aria-describedby={canProceed ? undefined : 'next-hint'}
          disabled={!canProceed}
          onClick={goNext}
        >
          {t(M.wizard.next)}
        </Button>
      </div>
    </section>
  );
}
