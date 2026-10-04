import Box from '@mui/material/Box';
import MuiButton from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import type { FileFieldFile, FileFieldProps } from '../../api';
import { formatBytes } from '../../shared/formatBytes';
import { FieldShell, fieldAria, fieldLabelId } from './FieldShell';
import { CloudUploadIcon, FileTextIcon, ImageIcon } from './icons';
import { Progress } from './Progress';
import { visuallyHidden } from './VisuallyHidden';

function FileThumbnail({ file }: { file: FileFieldFile }) {
  if (file.previewUrl) {
    return (
      <Box
        component="img"
        src={file.previewUrl}
        alt=""
        sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: 1, objectFit: 'cover' }}
      />
    );
  }
  const Icon = file.mimeType.startsWith('image/') ? ImageIcon : FileTextIcon;
  return <Icon aria-hidden="true" sx={{ fontSize: 32, flexShrink: 0, color: 'text.secondary' }} />;
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
      <Box
        {...getRootProps({ 'data-testid': 'file-dropzone' })}
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          p: 2,
          textAlign: 'center',
          border: 1,
          borderStyle: 'dashed',
          borderRadius: 1,
          borderColor: error ? 'error.main' : isDragActive ? 'primary.main' : 'divider',
          bgcolor: isDragActive ? 'action.hover' : undefined,
          opacity: isDisabled ? 0.6 : undefined,
          transition: 'border-color 150ms, background-color 150ms',
        }}
      >
        <input
          {...getInputProps({
            id: inputId,
            accept: accept.join(','),
            disabled: isDisabled,
            // The visible label names the input; react-dropzone's default aria-label would replace it.
            'aria-label': undefined,
            // Out of the layout; react-dropzone's own style is a 0×0 block that still takes a gap.
            style: visuallyHidden,
            ...aria,
          })}
        />
        {file ? (
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              gap: 1.5,
              textAlign: 'start',
            }}
          >
            <FileThumbnail file={file} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" noWrap dir="auto" sx={{ fontWeight: 500 }}>
                {file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {file.mimeType}
                {file.sizeBytes === undefined ? '' : ` · ${formatBytes(file.sizeBytes)}`}
              </Typography>
            </Box>
            <MuiButton
              ref={replaceRef}
              variant="outlined"
              size="small"
              onClick={pickFile}
              disabled={isDisabled}
              {...buttonAria}
            >
              {labels.replace}
            </MuiButton>
            {onRemove ? (
              <MuiButton
                variant="text"
                size="small"
                onClick={() => {
                  keepFocus.current = true;
                  onRemove();
                }}
                disabled={isDisabled}
              >
                {labels.remove}
              </MuiButton>
            ) : null}
          </Box>
        ) : (
          <>
            <CloudUploadIcon aria-hidden="true" sx={{ fontSize: 32, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {labels.drop}
            </Typography>
            <MuiButton
              ref={chooseRef}
              variant="outlined"
              size="small"
              onClick={pickFile}
              disabled={isDisabled}
              {...buttonAria}
            >
              {labels.choose}
            </MuiButton>
          </>
        )}
        {busyLabel ? (
          <Box sx={{ width: '100%', mt: 0.5 }}>
            <Progress label={busyLabel} />
          </Box>
        ) : null}
      </Box>
    </FieldShell>
  );
}
