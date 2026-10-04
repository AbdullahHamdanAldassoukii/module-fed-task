import { describe, expect, it } from '@rstest/core';
import { screen } from '@testing-library/react';
import { Alert } from '../testing/kit';
import { renderKit } from '../testing/renderKit';

describe('Alert', () => {
  it('error tone is role=alert; info is role=status', () => {
    renderKit(
      <>
        <Alert tone="error" title="Failed">
          Try again
        </Alert>
        <Alert tone="info">FYI</Alert>
      </>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    expect(screen.getByRole('status')).toHaveTextContent('FYI');
  });
  it('renders actions', () => {
    renderKit(
      <Alert tone="error" actions={<button type="button">Retry</button>}>
        x
      </Alert>,
    );
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
