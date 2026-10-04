import { describe, expect, it, rs } from '@rstest/core';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { AlertDialog } from '../testing/kit';
import { renderKit } from '../testing/renderKit';

const props = {
  title: 'Start a new application?',
  description: 'You will lose the summary.',
  cancelLabel: 'Cancel',
  confirmLabel: 'Start new',
};

function OpenedFromButton() {
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
  };
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Start a new application
      </button>
      <AlertDialog open={open} {...props} onCancel={close} onConfirm={close} />
    </>
  );
}

describe('AlertDialog', () => {
  it('renders nothing when closed', () => {
    renderKit(<AlertDialog open={false} {...props} onCancel={() => {}} onConfirm={() => {}} />);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
  it('is an alertdialog with title/description and focuses Cancel first', async () => {
    renderKit(<AlertDialog open {...props} onCancel={() => {}} onConfirm={() => {}} />);
    const dialog = await screen.findByRole('alertdialog', { name: props.title });
    expect(dialog).toHaveAccessibleDescription(props.description);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });
  it('Escape and Cancel call onCancel; confirm calls onConfirm', async () => {
    const onCancel = rs.fn();
    const onConfirm = rs.fn();
    renderKit(<AlertDialog open {...props} onCancel={onCancel} onConfirm={onConfirm} />);
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Start new' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
  it('the Cancel button calls onCancel only', async () => {
    const onCancel = rs.fn();
    const onConfirm = rs.fn();
    renderKit(<AlertDialog open {...props} onCancel={onCancel} onConfirm={onConfirm} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
  it('confirming never calls onCancel', async () => {
    const onCancel = rs.fn();
    const onConfirm = rs.fn();
    renderKit(<AlertDialog open {...props} onCancel={onCancel} onConfirm={onConfirm} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Start new' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });
  it('renders inside the UiProvider root', async () => {
    renderKit(<AlertDialog open {...props} onCancel={() => {}} onConfirm={() => {}} />, {
      direction: 'rtl',
    });
    expect(screen.getByTestId('ui-root')).toContainElement(await screen.findByRole('alertdialog'));
  });
  it('returns focus to the button that opened it when cancelled', async () => {
    renderKit(<OpenedFromButton />);
    const opener = screen.getByRole('button', { name: 'Start a new application' });
    await userEvent.click(opener);
    expect(await screen.findByRole('button', { name: 'Cancel' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
    await waitFor(() => {
      expect(opener).toHaveFocus();
    });
  });
});
