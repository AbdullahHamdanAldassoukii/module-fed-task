export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogContext = Record<string, unknown>;

export interface Logger {
  debug(event: string, context?: LogContext): void;
  info(event: string, context?: LogContext): void;
  warn(event: string, context?: LogContext): void;
  error(event: string, context?: LogContext & { error?: unknown }): void;
}

const order: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export function createConsoleLogger(level: LogLevel): Logger {
  const enabled = (candidate: LogLevel) => order[candidate] >= order[level];
  return {
    debug: (event, context) => {
      if (enabled('debug')) console.debug(`[debug] ${event}`, context ?? '');
    },
    info: (event, context) => {
      if (enabled('info')) console.info(`[info] ${event}`, context ?? '');
    },
    warn: (event, context) => {
      if (enabled('warn')) console.warn(`[warn] ${event}`, context ?? '');
    },
    error: (event, context) => {
      if (enabled('error')) console.error(`[error] ${event}`, context ?? '');
    },
  };
}

export const noopLogger: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};
