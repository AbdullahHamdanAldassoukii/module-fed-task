import { describe, expect, it } from '@rstest/core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useRef, useState } from 'react';
import { AlertDialog } from './AlertDialog';
import { UiProvider } from './UiProvider';

const props = {
  title: 'Start a new application?',
  description: 'You will lose the summary.',
  cancelLabel: 'Cancel',
  confirmLabel: 'Start new',
};

function Dialog({ destructive }: { destructive?: boolean }) {
  return (
    <UiProvider locale="en" direction="ltr" colorScheme="light">
      <AlertDialog
        open
        {...props}
        destructive={destructive}
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    </UiProvider>
  );
}

function ConfirmFocusesField() {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const fieldRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (confirmed) fieldRef.current?.focus();
  }, [confirmed]);
  return (
    <UiProvider locale="en" direction="ltr" colorScheme="light">
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Start a new application
      </button>
      <input ref={fieldRef} aria-label="First name" />
      <AlertDialog
        open={open}
        {...props}
        onCancel={() => {
          setOpen(false);
        }}
        onConfirm={() => {
          setOpen(false);
          setConfirmed(true);
        }}
      />
    </UiProvider>
  );
}

describe('shadcn AlertDialog', () => {
  it('draws the confirm button destructive only when asked', async () => {
    const { rerender } = render(<Dialog destructive />);
    const confirm = await screen.findByRole('button', { name: 'Start new' });
    expect(confirm).toHaveClass('bg-destructive', 'text-destructive-foreground');
    expect(confirm).not.toHaveClass('bg-primary');
    rerender(<Dialog />);
    expect(confirm).toHaveClass('bg-primary');
    expect(confirm).not.toHaveClass('bg-destructive');
  });

  it('leaves focus where the caller moved it after closing', async () => {
    render(<ConfirmFocusesField />);
    await userEvent.click(screen.getByRole('button', { name: 'Start a new application' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Start new' }));
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(screen.getByRole('textbox', { name: 'First name' })).toHaveFocus();
  });
});
