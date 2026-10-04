import { describe, expect, it } from '@rstest/core';
import { screen } from '@testing-library/react';
import { Progress, Skeleton } from '../testing/kit';
import { renderKit } from '../testing/renderKit';

describe('Progress and Skeleton', () => {
  it('indeterminate progress has a label and no valuenow', () => {
    renderKit(<Progress label="Reading file" />);
    const bar = screen.getByRole('progressbar', { name: 'Reading file' });
    expect(bar).not.toHaveAttribute('aria-valuenow');
  });
  it('determinate progress exposes the value', () => {
    renderKit(<Progress label="Upload" value={40} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
  });
  it('skeleton with a label is announced as busy status', () => {
    renderKit(<Skeleton label="Loading form" height={40} />);
    expect(screen.getByRole('status', { name: 'Loading form' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });
});
