import { cn } from 'cn';
import { CloudUploadIcon, FileTextIcon, ImageIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import type { FileFieldFile, FileFieldProps } from '../../api';
import { formatBytes } from '../../shared/formatBytes';
import { Button } from './components/ui/button';
import { FieldShell, fieldAria, fieldLabelId } from './FieldShell';
import { Progress } from './Progress';

function FileThumbnail({ file }: { file: FileFieldFile }) {
  if (file.previewUrl) {
    return (
      <img src={file.previewUrl} alt="" className="size-12 shrink-0 rounded-md object-cover" />
    );
  }
  const Icon = file.mimeType.startsWith('image/') ? ImageIcon : FileTextIcon;
  return <Icon aria-hidden="true" className="size-8 shrink-0 text-muted-foreground" />;
}

export function FileField({
  id,
  label,
  description,
  error,
  required,
  disabled,
  accept,
  onFilesSelected,
  file,
  onRemove,
  labels,
  busyLabel,
}: FileFieldProps) {
  const inputId = `${id}-input`;
  const isDisabled = Boolean(disabled) || Boolean(busyLabel);
  const chooseRef = useRef<HTMLButtonElement>(null);
  const replaceRef = useRef<HTMLButtonElement>(null);
  // Set by Choose file, Replace and Remove: what they start hides or disables the focused button.
  const keepFocus = useRef(false);
  const aria = fieldAria(id, { description, error, required });
  // The keyboard reaches the buttons, not the file input, so the label, hint and error describe
  // them as well. aria-required is not allowed on a button; it stays on the input.
  const buttonAria = {
    'aria-describedby': [fieldLabelId(id), aria['aria-describedby']].filter(Boolean).join(' '),
    'aria-invalid': aria['aria-invalid'],
  };
  const { getRootProps, getInputProps, open, isDragActive, rootRef } = useDropzone({
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isDisabled,
    // Everything offered goes to the form, accepted or not: it owns the count and type rules.
    onDrop: (accepted, rejected) => {
      const all = [...accepted, ...rejected.map((rejection) => rejection.file)];
      if (all.length > 0) onFilesSelected(all);
    },
  });

  // A picked file swaps Choose file for the file chip, Remove swaps it back, and reading a file
  // disables the buttons: focus falls to the page. Once the field is usable again, carry on from
  // the button it now shows, unless the user has moved elsewhere in the meantime.
  useEffect(() => {
    if (isDisabled || !keepFocus.current) return;
    keepFocus.current = false;
    const active = document.activeElement;
    const movedOn = active && active !== document.body && !rootRef.current?.contains(active);
    if (movedOn) return;
    (file ? replaceRef : chooseRef).current?.focus();
  }, [file, isDisabled, rootRef]);

  const pickFile = () => {
    keepFocus.current = true;
    open();
  };

  return (
    <FieldShell
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
      labelFor={inputId}
    >
      <div
        {...getRootProps({
          'data-testid': 'file-dropzone',
          className: cn(
            'relative flex flex-col items-center gap-3 rounded-lg border border-dashed border-input p-4 text-center transition-colors',
            isDragActive && 'border-primary bg-accent',
            error && 'border-destructive',
            isDisabled && 'opacity-60',
          ),
        })}
      >
        <input
          {...getInputProps({
            id: inputId,
            accept: accept.join(','),
            disabled: isDisabled,
            // The visible label names the input; react-dropzone's default aria-label would replace it.
            'aria-label': undefined,
            // sr-only keeps the input out of the layout; react-dropzone's own style is a 0×0 block.
            className: 'sr-only',
            style: undefined,
            ...aria,
          })}
        />
        {file ? (
          <div className="flex w-full items-center gap-3 text-start">
            <FileThumbnail file={file} />
            <div className="min-w-0 flex-1">
              <p dir="auto" className="truncate text-sm font-medium">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {file.mimeType}
                {file.sizeBytes === undefined ? '' : ` · ${formatBytes(file.sizeBytes)}`}
              </p>
            </div>
            <Button
              ref={replaceRef}
              type="button"
              variant="outline"
              size="sm"
              onClick={pickFile}
              disabled={isDisabled}
              {...buttonAria}
            >
              {labels.replace}
            </Button>
            {onRemove ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  keepFocus.current = true;
                  onRemove();
                }}
                disabled={isDisabled}
              >
                {labels.remove}
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <CloudUploadIcon aria-hidden="true" className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{labels.drop}</p>
            <Button
              ref={chooseRef}
              type="button"
              variant="outline"
              size="sm"
              onClick={pickFile}
              disabled={isDisabled}
              {...buttonAria}
            >
              {labels.choose}
            </Button>
          </>
        )}
        {busyLabel ? <Progress label={busyLabel} className="mt-1" /> : null}
      </div>
    </FieldShell>
  );
}
