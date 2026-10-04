import { describe, expect, it, rs } from '@rstest/core';
import { noopLogger } from '../logger';
import { createMemoryStorage, createWebStorage } from './index';

const asNumber = (raw: unknown) => (typeof raw === 'number' ? raw : null);

describe('createWebStorage', () => {
  it('round-trips JSON values and removes them', () => {
    const storage = createWebStorage('session', noopLogger);
    expect(storage.set('k', 42)).toBe(true);
    expect(storage.get('k', asNumber)).toBe(42);
    storage.remove('k');
    expect(storage.get('k', asNumber)).toBeNull();
  });

  it('returns null for corrupt JSON and values the parser rejects', () => {
    window.sessionStorage.setItem('bad', '{not json');
    window.sessionStorage.setItem('str', JSON.stringify('text'));
    const storage = createWebStorage('session', noopLogger);
    expect(storage.get('bad', asNumber)).toBeNull();
    expect(storage.get('str', asNumber)).toBeNull();
  });

  it.each(['session', 'local'] as const)(
    'falls back to defaults when %s storage is blocked and logs a warning',
    (kind) => {
      const warn = rs.fn();
      const logger = { ...noopLogger, warn };
      const property = `${kind}Storage` as const;
      const original = Object.getOwnPropertyDescriptor(window, property)!;
      const blockedError = new Error('blocked');
      Object.defineProperty(window, property, {
        configurable: true,
        get() {
          throw blockedError;
        },
      });
      try {
        const storage = createWebStorage(kind, logger);
        expect(storage.get('k', asNumber)).toBeNull();
        expect(storage.set('k', 1)).toBe(false);
        expect(warn).toHaveBeenNthCalledWith(1, 'storage.unavailable', {
          kind,
          error: blockedError,
        });
        expect(warn).toHaveBeenNthCalledWith(2, 'storage.unavailable', {
          kind,
          error: blockedError,
        });
      } finally {
        Object.defineProperty(window, property, original);
      }
    },
  );

  it('reports quota failures from the selected storage as false without throwing', () => {
    const warn = rs.fn();
    const logger = { ...noopLogger, warn };
    const storage = createWebStorage('session', logger);
    const area = window.sessionStorage;
    const originalSetItem = Object.getOwnPropertyDescriptor(area, 'setItem');
    const quotaError = new DOMException('quota', 'QuotaExceededError');
    Object.defineProperty(area, 'setItem', {
      configurable: true,
      value: () => {
        throw quotaError;
      },
    });
    try {
      expect(storage.set('big', 'x')).toBe(false);
      expect(warn).toHaveBeenCalledWith('storage.write_failed', {
        kind: 'session',
        key: 'big',
        error: quotaError,
      });
    } finally {
      if (originalSetItem) Object.defineProperty(area, 'setItem', originalSetItem);
      else Reflect.deleteProperty(area, 'setItem');
    }
  });
});

describe('createMemoryStorage', () => {
  it('behaves like storage without the browser', () => {
    const storage = createMemoryStorage();
    storage.set('a', { x: 1 });
    expect(storage.get('a', (raw) => raw as { x: number })).toEqual({ x: 1 });
  });
});
