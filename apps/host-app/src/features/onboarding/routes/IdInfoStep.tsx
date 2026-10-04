import { Button } from '@repo/ui';
import { M, useT } from '../../../lib/i18n';
import { useWizardNavigation } from '../hooks/useWizardNavigation';

export function IdInfoStep() {
  const { t } = useT();
  const { goBack } = useWizardNavigation();

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <p>{t(M.wizard.idInfoPlaceholder)}</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="secondary" onClick={goBack}>
          {t(M.wizard.back)}
        </Button>
      </div>
    </section>
  );
}
