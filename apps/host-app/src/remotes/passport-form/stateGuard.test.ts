import { describe, expect, it, rs } from '@rstest/core';
import { EMPTY_PASSPORT_DRAFT } from '@repo/passport-contract';
import { createStateGuard } from './stateGuard';

describe('createStateGuard', () => {
  it('passes valid states through and strips unknown fields', () => {
    const logger = { debug: rs.fn(), info: rs.fn(), warn: rs.fn(), error: rs.fn() };
    const guard = createStateGuard(logger);

    const output = guard(
      { valid: false, data: { ...EMPTY_PASSPORT_DRAFT, extra: 1 } },
      EMPTY_PASSPORT_DRAFT,
    );

    expect(output).toEqual({ valid: false, data: EMPTY_PASSPORT_DRAFT });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('treats malformed input as invalid with the last known draft and logs once per guard', () => {
    const logger = { debug: rs.fn(), info: rs.fn(), warn: rs.fn(), error: rs.fn() };
    const guard = createStateGuard(logger);
    const last = { ...EMPTY_PASSPORT_DRAFT, firstName: 'Ali' };

    expect(guard({ valid: true, data: { nope: 1 } }, last)).toEqual({ valid: false, data: last });
    expect(guard('garbage', last)).toEqual({ valid: false, data: last });
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
