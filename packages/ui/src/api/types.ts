import type { ComponentType, ReactNode, Ref } from 'react';

export type Direction = 'ltr' | 'rtl';
export type ColorScheme = 'light' | 'dark';

export interface UiProviderProps {
  locale: string;
  direction: Direction;
  colorScheme: ColorScheme;
  scope?: string;
  children: ReactNode;
}

export interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit';
  /** The id of the form this button submits, when it sits outside that form. */
  form?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  id?: string;
  className?: string;
  'aria-describedby'?: string;
  'aria-label'?: string;
  buttonRef?: Ref<HTMLButtonElement>;
}

export interface FieldBaseProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface TextFieldProps extends FieldBaseProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'numeric';
  placeholder?: string;
  maxLength?: number;
  inputRef?: Ref<HTMLInputElement>;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps extends FieldBaseProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  placeholder: string;
  name?: string;
  inputRef?: Ref<HTMLElement>;
}

export interface DatePlaceholder {
  year: string;
  month: string;
  day: string;
}

export interface DateFieldProps extends FieldBaseProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  locale: string;
  min?: string;
  max?: string;
  name?: string;
  openCalendarLabel: string;
  placeholder: DatePlaceholder;
  inputRef?: Ref<HTMLElement>;
}

export interface FileFieldFile {
  name: string;
  mimeType: string;
  sizeBytes?: number;
  previewUrl?: string;
}

export interface FileFieldLabels {
  choose: string;
  drop: string;
  replace: string;
  remove: string;
  required: string;
}

export interface FileFieldProps extends FieldBaseProps {
  accept: readonly string[];
  onFilesSelected: (files: File[]) => void;
  file?: FileFieldFile | null;
  onRemove?: () => void;
  onBlur?: () => void;
  inputRef?: Ref<HTMLElement>;
  labels: FileFieldLabels;
  busyLabel?: string | null;
}

export type StepStatus = 'complete' | 'current' | 'upcoming';
export interface StepperProps {
  ariaLabel: string;
  steps: { id: string; label: string; status: StepStatus }[];
  statusLabels?: Record<StepStatus, string>;
}

export interface AlertProps {
  tone: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  role?: 'alert' | 'status';
  className?: string;
}

export interface AlertDialogProps {
  open: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export interface DropdownMenuItem {
  id: string;
  label: string;
  selected?: boolean;
  onSelect: () => void;
}
export interface DropdownMenuProps {
  triggerLabel: string;
  triggerIcon?: ReactNode;
  ariaLabel: string;
  items: DropdownMenuItem[];
}

export interface SkeletonProps {
  className?: string;
  height?: number | string;
  width?: number | string;
  label?: string;
}
export interface ProgressProps {
  value?: number;
  label: string;
  className?: string;
}
export interface VisuallyHiddenProps {
  children: ReactNode;
}

export type ToastTone = 'success' | 'error' | 'info';
export type ToastFn = (
  message: string,
  options?: { tone?: ToastTone; description?: string },
) => void;

export interface UiKit {
  Button: ComponentType<ButtonProps>;
  TextField: ComponentType<TextFieldProps>;
  SelectField: ComponentType<SelectFieldProps>;
  DateField: ComponentType<DateFieldProps>;
  FileField: ComponentType<FileFieldProps>;
  Stepper: ComponentType<StepperProps>;
  Alert: ComponentType<AlertProps>;
  AlertDialog: ComponentType<AlertDialogProps>;
  DropdownMenu: ComponentType<DropdownMenuProps>;
  Skeleton: ComponentType<SkeletonProps>;
  Progress: ComponentType<ProgressProps>;
  VisuallyHidden: ComponentType<VisuallyHiddenProps>;
  Toaster: ComponentType<Record<string, never>>;
  toast: ToastFn;
  UiProvider: ComponentType<UiProviderProps>;
  UiGlobalStyles: ComponentType<Record<string, never>>;
}
