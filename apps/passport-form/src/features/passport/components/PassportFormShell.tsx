import { useEffect, useRef } from 'react';
import {
  EMPTY_PASSPORT_DRAFT,
  type PassportDraft,
  type PassportFormState,
} from '@repo/passport-contract';
import { M, useT } from '../../../lib/i18n';

export interface PassportFormShellProps {
  initialValue?: PassportDraft;
  onChange: (state: PassportFormState) => void;
}

export function PassportFormShell({ initialValue, onChange }: PassportFormShellProps) {
  const { t } = useT();
  const latest = useRef(onChange);

  useEffect(() => {
    latest.current = onChange;
  }, [onChange]);

  useEffect(() => {
    latest.current({ valid: false, data: initialValue ?? EMPTY_PASSPORT_DRAFT });
  }, [initialValue]);

  return (
    <section aria-labelledby="passport-form-title" style={{ display: 'grid', gap: 12 }}>
      <h2 id="passport-form-title" style={{ fontSize: 18, fontWeight: 600 }}>
        {t(M.form.title)}
      </h2>
      <p style={{ opacity: 0.8 }}>{t(M.form.intro)}</p>
    </section>
  );
}
