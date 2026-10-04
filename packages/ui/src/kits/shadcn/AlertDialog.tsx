import { useRef } from 'react';
import type { AlertDialogProps } from '../../api';
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialog as Root,
  AlertDialogTitle,
} from './components/ui/alert-dialog';

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
  const openerRef = useRef<HTMLElement | null>(null);
  return (
    // Radix reports confirmation and cancellation through the same close callback.
    <Root open={open}>
      <AlertDialogContent
        onOpenAutoFocus={() => {
          const opener = document.activeElement;
          openerRef.current = opener instanceof HTMLElement ? opener : null;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const current = document.activeElement;
          if (current === null || current === document.body) openerRef.current?.focus();
        }}
        onEscapeKeyDown={() => {
          onCancel();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              onCancel();
            }}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? 'destructive' : 'default'}
            onClick={() => {
              onConfirm();
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </Root>
  );
}
