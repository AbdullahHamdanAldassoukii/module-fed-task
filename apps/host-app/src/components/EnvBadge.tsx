import { useServices } from '../hooks/useServices';
import type { AppEnv } from '../lib/config/schema';
import { M, type AppMessageKey, useT } from '../lib/i18n';

type BadgeEnvironment = Exclude<AppEnv, 'production'>;

const ENVIRONMENT_LABEL = {
  development: M.env.development,
  qa: M.env.qa,
} satisfies Record<BadgeEnvironment, AppMessageKey>;

export function EnvBadge({
  onOpenDevPanel,
  isDevPanelOpen = false,
}: {
  onOpenDevPanel?: (trigger: HTMLElement) => void;
  isDevPanelOpen?: boolean;
}) {
  const { t } = useT();
  const { config } = useServices();
  if (config.env === 'production') return null;
  const environmentLabel = ENVIRONMENT_LABEL[config.env];

  const badge = (
    <span
      data-testid="env-badge"
      style={{
        border: '1px solid currentColor',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        padding: '2px 6px',
      }}
    >
      {t(environmentLabel)}
    </span>
  );

  if (!onOpenDevPanel) return badge;

  return (
    <button
      aria-controls="dev-panel"
      aria-expanded={isDevPanelOpen}
      aria-haspopup="dialog"
      aria-label={`${t(environmentLabel)} ${t(M.devPanel.open)}`}
      onClick={(event) => onOpenDevPanel(event.currentTarget)}
      style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', padding: 0 }}
      type="button"
    >
      {badge}
    </button>
  );
}
