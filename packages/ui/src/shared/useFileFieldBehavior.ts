import { useEffect, useImperativeHandle, useRef, type FocusEvent, type RefObject } from 'react';
import { useDropzone, type DropzoneInputProps, type DropzoneRootProps } from 'react-dropzone';
import type { FileFieldProps } from '../api';
import { fieldAria, fieldLabelId } from './fieldAria';

export interface FileFieldButtons {
  choose: RefObject<HTMLButtonElement>;
  replace: RefObject<HTMLButtonElement>;
}

export function useFileFieldBehavior(
  {
    id,
    description,
    error,
    required,
    disabled,
    accept,
    onFilesSelected,
    file,
    onRemove,
    onBlur,
    inputRef,
  }: FileFieldProps,
  buttons: FileFieldButtons,
) {
  const inputId = `${id}-input`;
  const requiredId = `${id}-required`;
  const isDisabled = Boolean(disabled);
  const hasFile = Boolean(file);
  const { choose: chooseRef, replace: replaceRef } = buttons;
  const keepFocus = useRef(false);
  const aria = fieldAria(id, { description, error, required });
  const buttonAria = {
    'aria-describedby': [fieldLabelId(id), required && requiredId, aria['aria-describedby']]
      .filter(Boolean)
      .join(' '),
    'aria-invalid': aria['aria-invalid'],
  };
  const { getRootProps, getInputProps, open, isDragActive, rootRef } = useDropzone({
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isDisabled,
    onDrop: (accepted, rejected) => {
      const all = [...accepted, ...rejected.map((rejection) => rejection.file)];
      if (all.length > 0) onFilesSelected(all);
    },
    onFileDialogCancel: () => {
      keepFocus.current = false;
    },
  });

  useImperativeHandle<HTMLElement | null, HTMLElement | null>(
    inputRef,
    () => (hasFile ? replaceRef.current : chooseRef.current),
    [hasFile, chooseRef, replaceRef],
  );

  useEffect(() => {
    if (isDisabled || !keepFocus.current) return;
    keepFocus.current = false;
    const active = document.activeElement;
    const movedOn = active && active !== document.body && !rootRef.current?.contains(active);
    if (movedOn) return;
    (hasFile ? replaceRef : chooseRef).current?.focus();
  }, [hasFile, isDisabled, rootRef, chooseRef, replaceRef]);

  const pickFile = () => {
    keepFocus.current = true;
    open();
  };

  const removeFile = () => {
    keepFocus.current = true;
    onRemove?.();
  };

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (document.activeElement === event.target) return;
    if (event.currentTarget.contains(event.relatedTarget)) return;
    onBlur?.();
  };

  return {
    isDragActive,
    isDisabled,
    buttonAria,
    pickFile,
    removeFile,
    requiredId,
    rootProps: <T extends DropzoneRootProps>(extra: T) => ({
      ...getRootProps({ 'data-testid': 'file-dropzone', ...extra }),
      // react-dropzone drops onBlur passed through its root props.
      onBlur: handleBlur,
    }),
    inputProps: <T extends DropzoneInputProps>(extra: T) =>
      getInputProps({
        id: inputId,
        accept: accept.join(','),
        disabled: isDisabled,
        'aria-label': undefined,
        ...aria,
        ...extra,
      }),
    inputId,
  };
}
