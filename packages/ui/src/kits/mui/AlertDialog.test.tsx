import { describe, expect, it, rs } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertDialog } from './AlertDialog';
import { UiProvider } from './UiProvider';

describe('MUI AlertDialog', () => {
  it('is answered, not dismissed by a click outside it', async () => {
    const onCancel = rs.fn();
    render(
      <UiProvider locale="en" direction="ltr" colorScheme="light">
        <AlertDialog
          open
          title="Start a new application?"
          description="You will lose the summary."
          cancelLabel="Cancel"
          confirmLabel="Start new"
          onCancel={onCancel}
          onConfirm={() => {}}
        />
      </UiProvider>,
    );
    await screen.findByRole('alertdialog');
    const backdrop = document.querySelector<HTMLElement>('.MuiBackdrop-root');
    expect(backdrop).not.toBeNull();
    if (backdrop) await userEvent.click(backdrop);
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});
