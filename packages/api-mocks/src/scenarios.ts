export const SCENARIOS = [
  'success',
  'slow',
  'timeout',
  'server-error',
  'network-error',
  'validation-error',
] as const;
export type Scenario = (typeof SCENARIOS)[number];
export const SCENARIO_HEADER = 'x-mock-scenario';
