import { useMemo } from 'react';
import { ACCEPTED_MIME_TYPES } from '@repo/passport-contract';
import { FileField } from '@repo/ui';
import { M, useT } from '../../../lib/i18n';
import type { DocumentFieldBinding } from '../hooks/usePassportForm';
import { documentChip } from './documentChip';
import { fieldErrorMessage } from './fieldErrorMessages';

interface DocumentFieldProps {
  id: string;
  field: DocumentFieldBinding;
}

export function DocumentField({ id, field }: DocumentFieldProps) {
  const { t } = useT();
  const { value, error } = field;
  const chip = useMemo(() => documentChip(value), [value]);

  return (
    <FileField
      id={id}
      label={t(M.fields.document)}
      description={t(M.fields.documentHint)}
      error={error ? t(fieldErrorMessage(error)) : undefined}
      required
      accept={ACCEPTED_MIME_TYPES}
      file={chip}
      onFilesSelected={field.onFilesSelected}
      onRemove={field.onRemove}
      onBlur={field.onBlur}
      inputRef={field.inputRef}
      busyLabel={value.status === 'reading' ? t(M.fields.readingFile) : null}
      labels={{
        choose: t(M.fields.chooseFile),
        drop: t(M.fields.dropFile),
        replace: t(M.fields.replaceFile),
        remove: t(M.fields.removeFile),
        required: t(M.fields.required),
      }}
    />
  );
}
