import type { UiKit } from '../../api';
import { Alert } from './Alert';
import { AlertDialog } from './AlertDialog';
import { Button } from './Button';
import { DateField } from './DateField';
import { DropdownMenu } from './DropdownMenu';
import { FileField } from './FileField';
import { Progress } from './Progress';
import { SelectField } from './SelectField';
import { Skeleton } from './Skeleton';
import { Stepper } from './Stepper';
import { TextField } from './TextField';
import { Toaster, toast } from './Toaster';
import { UiGlobalStyles } from './UiGlobalStyles';
import { UiProvider } from './UiProvider';
import { VisuallyHidden } from './VisuallyHidden';

export {
  Alert,
  AlertDialog,
  Button,
  DateField,
  DropdownMenu,
  FileField,
  Progress,
  SelectField,
  Skeleton,
  Stepper,
  TextField,
  Toaster,
  toast,
  UiGlobalStyles,
  UiProvider,
  VisuallyHidden,
};
export { usePortalContainer } from './portal';
export { formatBytes } from '../../shared/formatBytes';
export type * from '../../api';

export const kit = {
  Alert,
  AlertDialog,
  Button,
  DateField,
  DropdownMenu,
  FileField,
  Progress,
  SelectField,
  Skeleton,
  Stepper,
  TextField,
  Toaster,
  toast,
  UiGlobalStyles,
  UiProvider,
  VisuallyHidden,
} satisfies UiKit;
