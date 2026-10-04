import Box from '@mui/material/Box';
import MuiButton from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useRef } from 'react';
import type { FileFieldFile, FileFieldProps } from '../../api';
import { formatBytes } from '../../shared/formatBytes';
import { useFileFieldBehavior } from '../../shared/useFileFieldBehavior';
import { FieldShell } from './FieldShell';
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
      <Box
        {...field.rootProps({})}
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
          borderColor: error ? 'error.main' : field.isDragActive ? 'primary.main' : 'divider',
          bgcolor: field.isDragActive ? 'action.hover' : undefined,
          opacity: field.isDisabled ? 0.6 : undefined,
          transition: 'border-color 150ms, background-color 150ms',
        }}
      >
        <input
          {...field.inputProps({
            style: visuallyHidden,
          })}
        />
        {required ? (
          <span id={field.requiredId} hidden>
            {labels.required}
          </span>
        ) : null}
        {file ? (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              width: '100%',
              alignItems: 'center',
              gap: 1.5,
              textAlign: 'start',
            }}
          >
            <FileThumbnail file={file} />
            <Box sx={{ minWidth: 0, flex: '1 1 10rem' }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                <bdi>{file.name}</bdi>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {file.mimeType}
                {file.sizeBytes === undefined ? '' : ` · ${formatBytes(file.sizeBytes)}`}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexShrink: 0, gap: 1, marginInlineStart: 'auto' }}>
              <MuiButton
                ref={replaceRef}
                variant="outlined"
                size="small"
                onClick={field.pickFile}
                disabled={field.isDisabled}
                {...field.buttonAria}
              >
                {labels.replace}
              </MuiButton>
              {onRemove ? (
                <MuiButton
                  variant="text"
                  size="small"
                  onClick={field.removeFile}
                  disabled={field.isDisabled}
                >
                  {labels.remove}
                </MuiButton>
              ) : null}
            </Box>
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
              onClick={field.pickFile}
              disabled={field.isDisabled}
              {...field.buttonAria}
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
