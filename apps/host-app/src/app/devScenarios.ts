import { SCENARIO_HEADER, type Scenario } from '@repo/api-mocks/scenarios';
import { getRemoteScenario, setRemoteScenario, type RemoteScenario } from './remoteScenarios';

export type ApiScenario = Scenario;

let apiScenario: ApiScenario = 'success';
const listeners = new Set<() => void>();

export const devScenarios = {
  getApiScenario: () => apiScenario,
  setApiScenario: (next: ApiScenario) => {
    apiScenario = next;
    listeners.forEach((listener) => listener());
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getRemoteScenario,
  setRemoteScenario: (next: RemoteScenario) => {
    setRemoteScenario(next);
    listeners.forEach((listener) => listener());
  },
  reset: () => {
    apiScenario = 'success';
    setRemoteScenario('normal');
    listeners.forEach((listener) => listener());
  },
};

export function getExtraRequestHeaders(): Record<string, string> {
  return apiScenario === 'success' ? {} : { [SCENARIO_HEADER]: apiScenario };
}
