import { SCENARIOS } from '@repo/api-mocks/scenarios';
import { Button } from '@repo/ui';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { M, type AppMessageKey, useT } from '../../lib/i18n';
import { useServices } from '../../hooks/useServices';
import { devScenarios, type ApiScenario } from '../devScenarios';
import { REMOTE_SCENARIOS, type RemoteScenario } from '../remoteScenarios';
import { devPanel } from './devPanelStore';

const API_SCENARIO_LABEL = {
  success: M.devPanel.scenarios.success,
  slow: M.devPanel.scenarios.slow,
  timeout: M.devPanel.scenarios.timeout,
  'server-error': M.devPanel.scenarios['server-error'],
  'network-error': M.devPanel.scenarios['network-error'],
  'validation-error': M.devPanel.scenarios['validation-error'],
} satisfies Record<ApiScenario, AppMessageKey>;

const REMOTE_SCENARIO_LABEL = {
  normal: M.devPanel.remote.normal,
  down: M.devPanel.remote.down,
  slow: M.devPanel.remote.slow,
  mismatch: M.devPanel.remote.mismatch,
} satisfies Record<RemoteScenario, AppMessageKey>;

export function DevPanel() {
  const { t } = useT();
  const { remotes } = useServices();
  const isOpen = useSyncExternalStore(
    devPanel.subscribe,
    devPanel.getSnapshot,
    devPanel.getSnapshot,
  );
  const apiScenario = useSyncExternalStore(
    devScenarios.subscribe,
    () => devScenarios.getApiScenario(),
    () => devScenarios.getApiScenario(),
  );
  const remoteScenario = useSyncExternalStore(
    devScenarios.subscribe,
    () => devScenarios.getRemoteScenario(),
    () => devScenarios.getRemoteScenario(),
  );
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        devPanel.close();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      aria-labelledby="dev-panel-title"
      className="host-dev-panel"
      id="dev-panel"
      role="dialog"
      style={{
        bottom: 0,
        display: 'grid',
        gap: 12,
        insetInlineEnd: 0,
        maxWidth: 360,
        padding: 16,
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 50,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <h2 id="dev-panel-title" style={{ fontSize: 18, margin: 0 }}>
          {t(M.devPanel.title)}
        </h2>
        <Button
          aria-label={t(M.devPanel.close)}
          buttonRef={closeButtonRef}
          size="sm"
          variant="ghost"
          onClick={devPanel.close}
        >
          ×
        </Button>
      </div>
      <fieldset style={{ border: 0, display: 'grid', gap: 6, padding: 0 }}>
        <legend style={{ fontWeight: 600 }}>{t(M.devPanel.apiScenario)}</legend>
        {SCENARIOS.map((scenario) => (
          <label key={scenario} style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
            <input
              checked={apiScenario === scenario}
              name="api-scenario"
              onChange={() => devScenarios.setApiScenario(scenario)}
              type="radio"
              value={scenario}
            />
            {t(API_SCENARIO_LABEL[scenario])}
          </label>
        ))}
      </fieldset>
      <fieldset style={{ border: 0, display: 'grid', gap: 6, padding: 0 }}>
        <legend style={{ fontWeight: 600 }}>{t(M.devPanel.remoteScenario)}</legend>
        {REMOTE_SCENARIOS.map((scenario) => (
          <label key={scenario} style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
            <input
              checked={remoteScenario === scenario}
              name="remote-scenario"
              onChange={() => {
                devScenarios.setRemoteScenario(scenario);
                remotes.passportForm.reset();
              }}
              type="radio"
              value={scenario}
            />
            {t(REMOTE_SCENARIO_LABEL[scenario])}
          </label>
        ))}
        <p style={{ fontSize: 13, margin: 0, opacity: 0.8 }}>{t(M.devPanel.remoteHint)}</p>
      </fieldset>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            devScenarios.reset();
            remotes.passportForm.reset();
          }}
        >
          {t(M.devPanel.reset)}
        </Button>
      </div>
    </div>
  );
}
