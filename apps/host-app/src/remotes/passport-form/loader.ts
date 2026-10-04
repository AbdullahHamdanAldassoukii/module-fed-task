import { loadRemote, registerRemotes } from '@module-federation/enhanced/runtime';
import { isCompatibleContractVersion, type PassportFormModule } from '@repo/passport-contract';
import { RemoteContractError, RemoteLoadError } from '../../lib/errors';
import type { Logger } from '../../lib/logger';
import type { RemoteModuleLoader } from '../types';

export const REMOTE_NAME = 'passport_form';
export const REMOTE_MODULE_ID = 'passport_form/PassportForm';
export const DEFAULT_REMOTE_TIMEOUT_MS = 15_000;

export interface PassportFormLoaderOptions {
  manifestUrl: string;
  logger: Logger;
  timeoutMs?: number;
  importModule?: () => Promise<unknown>;
  reregister?: (manifestUrl: string) => void;
  isCompatibleVersion?: (remoteVersion: unknown) => boolean;
}

const defaultImport = () => loadRemote<PassportFormModule>(REMOTE_MODULE_ID);
export const defaultReregister = (manifestUrl: string, register = registerRemotes) => {
  register([{ name: REMOTE_NAME, entry: manifestUrl }], { force: true });
};

function isModuleShape(module: unknown): module is { default: unknown; contractVersion?: unknown } {
  return typeof module === 'object' && module !== null && 'default' in module;
}

export function createPassportFormLoader(
  options: PassportFormLoaderOptions,
): RemoteModuleLoader<PassportFormModule> {
  const {
    manifestUrl,
    logger,
    timeoutMs = DEFAULT_REMOTE_TIMEOUT_MS,
    importModule = defaultImport,
    reregister = defaultReregister,
    isCompatibleVersion = isCompatibleContractVersion,
  } = options;
  let pending: Promise<PassportFormModule> | null = null;

  async function loadModule(): Promise<PassportFormModule> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new RemoteLoadError('timeout')), timeoutMs);
    });

    let module: unknown;
    try {
      module = await Promise.race([importModule(), timeout]);
    } catch (error) {
      const appError =
        error instanceof RemoteLoadError
          ? error
          : new RemoteLoadError('load-failed', { cause: error });
      logger.error('remote.load_failed', { remote: REMOTE_NAME, reason: appError.reason, error });
      throw appError;
    } finally {
      clearTimeout(timer);
    }

    if (
      !isModuleShape(module) ||
      module.default === null ||
      (typeof module.default !== 'function' && typeof module.default !== 'object')
    ) {
      const error = new RemoteContractError('module has no default export');
      logger.error('remote.contract_mismatch', { remote: REMOTE_NAME, error });
      throw error;
    }
    if (!isCompatibleVersion(module.contractVersion)) {
      const error = new RemoteContractError(
        `contractVersion ${String(module.contractVersion)} is not compatible with this host`,
      );
      logger.error('remote.contract_mismatch', {
        remote: REMOTE_NAME,
        remoteVersion: module.contractVersion,
        error,
      });
      throw error;
    }

    return module as PassportFormModule;
  }

  return {
    load: () => {
      if (pending) return pending;

      const next = loadModule().catch((error: unknown) => {
        if (pending === next) pending = null;
        throw error;
      });
      pending = next;
      return next;
    },
    reset: () => {
      pending = null;
      try {
        reregister(manifestUrl);
      } catch (error) {
        logger.warn('remote.reregister_failed', { error });
      }
    },
  };
}
