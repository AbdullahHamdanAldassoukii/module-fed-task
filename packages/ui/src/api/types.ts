import type { ComponentType, ReactNode, Ref } from 'react';

export type Direction = 'ltr' | 'rtl';
export type ColorScheme = 'light' | 'dark';

export interface UiProviderProps {
  locale: string;
  direction: Direction;
  colorScheme: ColorScheme;
  /** An instance id. The MUI kit uses it as the Emotion cache key prefix; the shadcn kit ignores it. */
  scope?: string;
  children: ReactNode;
}

export interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit';
  disabled?: boolean;
  /** Shows a spinner, sets aria-busy, and disables the button. */
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
  /** Translated error text. Presence marks the field invalid. */
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
  /** The focusable control (the kits render different elements), e.g. for focus-on-error. */
  inputRef?: Ref<HTMLElement>;
}

/**
 * value is '' | 'YYYY-MM-DD' | any other non-empty text (= invalid, the form decides).
 * Both kits emit exactly these shapes.
 */
export interface DateFieldProps extends FieldBaseProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  locale: string;
  /** YYYY-MM-DD; dates before are disabled in the calendar. */
  min?: string;
  /** YYYY-MM-DD; dates after are disabled in the calendar. */
  max?: string;
  name?: string;
  /** aria-label of the button that opens the calendar. */
  openCalendarLabel: string;
  /** The focusable control (the kits render different elements), e.g. for focus-on-error. */
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
}

export interface FileFieldProps extends FieldBaseProps {
  /** MIME types for the picker hint; the form validates the real file. */
  accept: readonly string[];
  /** Called with every file the user offered, accepted or not; the form validates count and type. */
  onFilesSelected: (files: File[]) => void;
  /** The currently chosen file (restored or fresh). */
  file?: FileFieldFile | null;
  onRemove?: () => void;
  labels: FileFieldLabels;
  /** When set, shows an indeterminate progress with this label and disables the control. */
  busyLabel?: string | null;
}

export type StepStatus = 'complete' | 'current' | 'upcoming';
export interface StepperProps {
  ariaLabel: string;
  steps: { id: string; label: string; status: StepStatus }[];
  /**
   * Status words read after each step label (visually hidden, e.g. "Passport (complete)").
   * Pass translated words; the English default only suits English pages.
   */
  statusLabels?: Record<StepStatus, string>;
}

export interface AlertProps {
  tone: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  /** 'alert' interrupts; 'status' is polite. Default: 'alert' for error, 'status' otherwise. */
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
  /** 0–100; omit for indeterminate */
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
  /** Global reset. Rendered once by the host (and the remote's standalone page), never by the exposed remote. */
  UiGlobalStyles: ComponentType<Record<string, never>>;
}
