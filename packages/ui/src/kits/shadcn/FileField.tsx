import { cn } from 'cn';
import { CloudUploadIcon, FileTextIcon, ImageIcon } from 'lucide-react';
import { useRef } from 'react';
import type { FileFieldFile, FileFieldProps } from '../../api';
import { formatBytes } from '../../shared/formatBytes';
import { useFileFieldBehavior } from '../../shared/useFileFieldBehavior';
import { Button } from './components/ui/button';
import { FieldShell } from './FieldShell';
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

export function FileField(props: FileFieldProps) {
  const { id, label, description, error, required, file, onRemove, labels, busyLabel } = props;
  const chooseRef = useRef<HTMLButtonElement>(null);
  const replaceRef = useRef<HTMLButtonElement>(null);
  const field = useFileFieldBehavior(props, { choose: chooseRef, replace: replaceRef });

  return (
    <FieldShell
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
      labelFor={field.inputId}
    >
      <div
        {...field.rootProps({
          className: cn(
            'relative flex flex-col items-center gap-3 rounded-lg border border-dashed border-input p-4 text-center transition-colors',
            field.isDragActive && 'border-primary bg-accent',
            error && 'border-destructive',
            field.isDisabled && 'opacity-60',
          ),
        })}
      >
        <input
          {...field.inputProps({
            className: 'sr-only',
            style: undefined,
          })}
        />
        {required ? (
          <span id={field.requiredId} hidden>
            {labels.required}
          </span>
        ) : null}
        {file ? (
          <div className="flex w-full flex-wrap items-center gap-3 text-start">
            <FileThumbnail file={file} />
            <div className="min-w-0 flex-1 basis-40">
              <p className="truncate text-sm font-medium">
                <bdi>{file.name}</bdi>
              </p>
              <p className="text-xs text-muted-foreground">
                {file.mimeType}
                {file.sizeBytes === undefined ? '' : ` · ${formatBytes(file.sizeBytes)}`}
              </p>
            </div>
            <div className="ms-auto flex shrink-0 gap-2">
              <Button
                ref={replaceRef}
                type="button"
                variant="outline"
                size="sm"
                onClick={field.pickFile}
                disabled={field.isDisabled}
                {...field.buttonAria}
              >
                {labels.replace}
              </Button>
              {onRemove ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={field.removeFile}
                  disabled={field.isDisabled}
                >
                  {labels.remove}
                </Button>
              ) : null}
            </div>
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
              onClick={field.pickFile}
              disabled={field.isDisabled}
              {...field.buttonAria}
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
