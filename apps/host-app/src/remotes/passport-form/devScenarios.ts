import {
  registerPlugins,
  type ModuleFederationRuntimePlugin,
} from '@module-federation/enhanced/runtime';
import { isCompatibleContractVersion } from '@repo/passport-contract';
import { REMOTE_NAME } from './loader';

export const REMOTE_SCENARIOS = ['normal', 'down', 'slow', 'mismatch'] as const;
export type RemoteScenario = (typeof REMOTE_SCENARIOS)[number];

const DEAD_REMOTE_MANIFEST_URL = 'http://127.0.0.1:9/mf-manifest.json';
let scenario: RemoteScenario = 'normal';
let revision = 0;
const listeners = new Set<() => void>();

export const getRemoteScenario = () => scenario;
export const setRemoteScenario = (next: RemoteScenario) => {
  if (scenario === next) return;

  scenario = next;
  revision += 1;
  listeners.forEach((listener) => listener());
};
export const getRemoteScenarioRevision = () => revision;
export const subscribeRemoteScenario = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function isScenarioCompatibleContractVersion(remoteVersion: unknown) {
  return scenario !== 'mismatch' && isCompatibleContractVersion(remoteVersion);
}

export function installPassportFormScenarioPlugin(manifestUrl: string) {
  const plugin: ModuleFederationRuntimePlugin = {
    name: 'passport-form-dev-scenarios',
    beforeRequest: async (args) => {
      if (!args.id.startsWith(`${REMOTE_NAME}/`)) return args;

      const remote = args.options.remotes.find((candidate) => candidate.name === REMOTE_NAME);
      if (remote && 'entry' in remote) {
        remote.entry = scenario === 'down' ? DEAD_REMOTE_MANIFEST_URL : manifestUrl;
      }
      if (scenario === 'slow') await new Promise<void>((resolve) => setTimeout(resolve, 5_000));
      return args;
    },
    errorLoadRemote: () => undefined,
  };

  registerPlugins([plugin]);
}
