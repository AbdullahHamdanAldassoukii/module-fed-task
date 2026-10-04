import { describe, expect, it } from '@rstest/core';
import { formatBytes } from './formatBytes';

describe('formatBytes', () => {
  it('writes bytes, KB and MB, dropping a trailing .0', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
    expect(formatBytes(2.25 * 1024 * 1024)).toBe('2.3 MB');
  });
});
