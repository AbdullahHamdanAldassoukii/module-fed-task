import { M, useT } from '../lib/i18n';
import { EnvBadge } from './EnvBadge';
import { LanguageMenu } from './LanguageMenu';
import { ThemeMenu } from './ThemeMenu';

export function AppHeader({
  onOpenDevPanel,
  isDevPanelOpen,
}: {
  onOpenDevPanel?: (trigger: HTMLElement) => void;
  isDevPanelOpen?: boolean;
}) {
  const { t } = useT();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid var(--border, #e4e4e7)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 600 }}>{t(M.app.title)}</span>
        <EnvBadge isDevPanelOpen={isDevPanelOpen} onOpenDevPanel={onOpenDevPanel} />
      </div>
      <nav aria-label={t(M.header.preferences)} style={{ display: 'flex', gap: 4 }}>
        <LanguageMenu />
        <ThemeMenu />
      </nav>
    </header>
  );
}
