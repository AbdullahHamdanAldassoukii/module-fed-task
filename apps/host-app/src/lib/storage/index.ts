import type { Logger } from '../logger';

export interface KeyValueStorage {
  get<T>(key: string, parse: (raw: unknown) => T | null): T | null;
  set(key: string, value: unknown): boolean;
  remove(key: string): void;
}

export function createWebStorage(kind: 'local' | 'session', logger: Logger): KeyValueStorage {
  const area = (): Storage | null => {
    try {
      return kind === 'local' ? window.localStorage : window.sessionStorage;
    } catch (error) {
      logger.warn('storage.unavailable', { kind, error });
      return null;
    }
  };

  return {
    get(key, parse) {
      const storage = area();
      if (!storage) return null;
      try {
        const raw = storage.getItem(key);
        if (raw === null) return null;
        return parse(JSON.parse(raw) as unknown);
      } catch (error) {
        logger.warn('storage.read_failed', { kind, key, error });
        return null;
      }
    },
    set(key, value) {
      const storage = area();
      if (!storage) return false;
      try {
        storage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        logger.warn('storage.write_failed', { kind, key, error });
        return false;
      }
    },
    remove(key) {
      const storage = area();
      try {
        storage?.removeItem(key);
      } catch (error) {
        logger.warn('storage.remove_failed', { kind, key, error });
      }
    },
  };
}

export function createMemoryStorage(): KeyValueStorage {
  const values = new Map<string, string>();
  return {
    get(key, parse) {
      const raw = values.get(key);
      if (raw === undefined) return null;
      try {
        return parse(JSON.parse(raw) as unknown);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        values.set(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      values.delete(key);
    },
  };
}
