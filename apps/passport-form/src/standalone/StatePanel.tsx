import type { PassportFormState } from '@repo/passport-contract';
import { M, type AppMessageKey, useT } from '../lib/i18n';

const VALIDITY_LABEL = {
  valid: M.standalone.valid,
  invalid: M.standalone.invalid,
} satisfies Record<'valid' | 'invalid', AppMessageKey>;

const shorten = (state: PassportFormState) =>
  JSON.stringify(
    state,
    (key, value: unknown) =>
      key === 'base64' && typeof value === 'string'
        ? `${value.slice(0, 16)}… (${value.length} chars)`
        : value,
    2,
  );

interface StatePanelProps {
  history: PassportFormState[];
}

export function StatePanel({ history }: StatePanelProps) {
  const { t } = useT();
  const last = history.at(-1);
  const reports = [...history].reverse();

  return (
    <aside aria-label={t(M.standalone.reported)} style={{ display: 'grid', gap: 8 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600 }}>
        {t(M.standalone.reported)}{' '}
        <span data-testid="reported-valid">
          ({last ? t(VALIDITY_LABEL[last.valid ? 'valid' : 'invalid']) : '—'})
        </span>
      </h2>
      <ol style={{ display: 'grid', gap: 8, margin: 0, paddingInlineStart: 20 }}>
        {reports.map((state, index) => (
          <li key={history.length - index}>
            <pre
              data-testid="reported-state"
              style={{
                fontSize: 12,
                maxHeight: 320,
                overflow: 'auto',
                background: 'rgba(127,127,127,.08)',
                padding: 8,
                borderRadius: 6,
              }}
            >
              {shorten(state)}
            </pre>
          </li>
        ))}
      </ol>
      <p data-testid="reported-count" style={{ fontSize: 12, opacity: 0.7 }}>
        {history.length} {t(M.standalone.reports)}
      </p>
    </aside>
  );
}
