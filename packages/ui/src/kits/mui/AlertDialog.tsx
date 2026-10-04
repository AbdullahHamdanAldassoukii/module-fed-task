import MuiButton from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useId } from 'react';
import type { AlertDialogProps } from '../../api';
import { usePortalContainer } from './portal';

const focusOnMount = (button: HTMLButtonElement | null) => {
  button?.focus();
};

export function AlertDialog({
  open,
  title,
  description,
  cancelLabel,
  confirmLabel,
  destructive = false,
  onCancel,
  onConfirm,
}: AlertDialogProps) {
  const container = usePortalContainer();
  const titleId = useId();
  const descriptionId = useId();
  return (
    // MUI resolves the container once when the dialog opens.
    <Dialog
      open={open && container !== undefined}
      container={container}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={(_event, reason) => {
        if (reason === 'escapeKeyDown') onCancel();
      }}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id={descriptionId}>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <MuiButton
          ref={focusOnMount}
          onClick={() => {
            onCancel();
          }}
        >
          {cancelLabel}
        </MuiButton>
        <MuiButton
          variant="contained"
          color={destructive ? 'error' : 'primary'}
          onClick={() => {
            onConfirm();
          }}
        >
          {confirmLabel}
        </MuiButton>
      </DialogActions>
    </Dialog>
  );
}
