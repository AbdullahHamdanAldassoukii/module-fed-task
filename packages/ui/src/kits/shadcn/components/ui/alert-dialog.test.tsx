import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { UiProvider } from '../../UiProvider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from './alert-dialog';

function OpenDialog({ variant }: { variant?: 'default' | 'destructive' }) {
  return (
    <UiProvider locale="en" direction="ltr" colorScheme="light">
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>Discard changes?</AlertDialogTitle>
          <AlertDialogDescription>Your answers will be lost.</AlertDialogDescription>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction variant={variant}>Discard</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </UiProvider>
  );
}

describe('shadcn alert dialog', () => {
  afterEach(() => {
    rs.restoreAllMocks();
  });

  it('opens inside the UiProvider root without React warnings', async () => {
    const consoleError = rs.spyOn(console, 'error');
    render(<OpenDialog />);
    const dialog = await screen.findByRole('alertdialog');
    expect(screen.getByTestId('ui-root')).toContainElement(dialog);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('draws a destructive action solid and drops the primary colours', async () => {
    render(<OpenDialog variant="destructive" />);
    const action = await screen.findByRole('button', { name: 'Discard' });
    expect(action).toHaveClass('bg-destructive', 'text-destructive-foreground');
    expect(action).not.toHaveClass('bg-primary');
    expect(action).not.toHaveClass('text-primary-foreground');
  });
});
