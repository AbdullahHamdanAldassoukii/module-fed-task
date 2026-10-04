import { toast as sonnerToast } from 'sonner';
import type { ToastFn } from '../../api';
import { Toaster as Base } from './components/ui/sonner';
import { useUiSettings } from './settings';

export function Toaster() {
  const { colorScheme, direction } = useUiSettings();
  return (
    <Base theme={colorScheme} dir={direction} position="bottom-center" richColors closeButton />
  );
}

export const toast: ToastFn = (message, options) => {
  const show =
    options?.tone === 'error'
      ? sonnerToast.error
      : options?.tone === 'success'
        ? sonnerToast.success
        : sonnerToast;
  show(message, { description: options?.description });
};
