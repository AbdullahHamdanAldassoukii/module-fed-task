import { describe, expect, it } from '@rstest/core';
import { act, render, screen } from '@testing-library/react';
import { Toaster, toast } from './Toaster';
import { UiProvider } from './UiProvider';

describe('MUI Toaster', () => {
  it('shows toasts inside the UiProvider root, in its direction, with the tone as role', async () => {
    render(
      <UiProvider locale="ar" direction="rtl" colorScheme="dark">
        <Toaster />
      </UiProvider>,
    );
    act(() => {
      toast('Upload failed', { tone: 'error', description: 'Try again later' });
      toast('Saved', { tone: 'success' });
    });
    const failed = (await screen.findByText('Upload failed')).closest('[role="alert"]');
    expect(failed).not.toBeNull();
    expect(failed).toHaveTextContent('Try again later');
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    const root = screen.getByTestId('ui-root');
    expect(root).toContainElement(screen.getByRole('alert'));
    expect(root).toHaveAttribute('dir', 'rtl');
  });
});
