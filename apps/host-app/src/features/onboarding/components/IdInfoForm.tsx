import { SelectField, TextField } from '@repo/ui';
import { useCallback, useMemo, useRef } from 'react';
import { M, useT, type AppMessageKey } from '../../../lib/i18n';
import type { IdInfoFieldBinding } from '../hooks/useIdInfoForm';
import {
  maskEmiratesId,
  nationalityOptions,
  type IdInfoField,
  type IdInfoFieldErrorCode,
} from '../model';

const REQUIRED_MESSAGE = {
  idNumber: M.idInfo.idNumber.required,
  nationality: M.idInfo.nationality.required,
} satisfies Record<IdInfoField, AppMessageKey>;

function errorMessage(field: IdInfoField, code: IdInfoFieldErrorCode): AppMessageKey {
  const messages = {
    required: REQUIRED_MESSAGE[field],
    emiratesIdFormat: M.idInfo.idNumber.format,
    rejected: M.idInfo.rejected,
  } satisfies Record<IdInfoFieldErrorCode, AppMessageKey>;
  return messages[code];
}

function IdNumberField({ field, disabled }: { field: IdInfoFieldBinding; disabled: boolean }) {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { ref: bindRef, onChange } = field;
  const setRef = useCallback(
    (element: HTMLInputElement | null) => {
      inputRef.current = element;
      bindRef(element);
    },
    [bindRef],
  );

  const handleChange = (raw: string) => {
    const input = inputRef.current;
    const masked = maskEmiratesId(raw, input?.selectionStart ?? raw.length);
    onChange(masked.value);
    if (input && document.activeElement === input) {
      // Writing the masked text now leaves React nothing to change, so the caret stays where
      // the user was typing instead of jumping to the end.
      input.value = masked.value;
      input.setSelectionRange(masked.caret, masked.caret);
    }
  };

  return (
    <TextField
      autoComplete="off"
      description={t(M.idInfo.idNumber.hint)}
      disabled={disabled}
      error={field.error ? t(errorMessage('idNumber', field.error)) : undefined}
      id="id-number"
      inputMode="numeric"
      inputRef={setRef}
      label={t(M.idInfo.idNumber.label)}
      name="idNumber"
      onBlur={field.onBlur}
      onChange={handleChange}
      required
      value={field.value}
    />
  );
}

export function IdInfoForm({
  fields,
  disabled,
  locale,
}: {
  fields: Record<IdInfoField, IdInfoFieldBinding>;
  disabled: boolean;
  locale: string;
}) {
  const { t } = useT();
  const options = useMemo(() => nationalityOptions(locale), [locale]);
  const { nationality } = fields;

  return (
    <div className="wizard-fields">
      <IdNumberField disabled={disabled} field={fields.idNumber} />
      <SelectField
        description={t(M.idInfo.nationality.hint)}
        disabled={disabled}
        error={nationality.error ? t(errorMessage('nationality', nationality.error)) : undefined}
        id="nationality"
        inputRef={nationality.ref}
        label={t(M.idInfo.nationality.label)}
        name="nationality"
        onBlur={nationality.onBlur}
        onChange={nationality.onChange}
        options={options}
        placeholder={t(M.idInfo.nationality.placeholder)}
        required
        value={nationality.value}
      />
    </div>
  );
}
