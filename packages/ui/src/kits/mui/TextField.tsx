import OutlinedInput from '@mui/material/OutlinedInput';
import type { TextFieldProps } from '../../api';
import { FieldShell, fieldAria } from './FieldShell';

export function TextField({
  id,
  label,
  description,
  error,
  required,
  disabled,
  value,
  onChange,
  onBlur,
  name,
  autoComplete,
  inputMode,
  placeholder,
  maxLength,
  inputRef,
}: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} description={description} error={error} required={required}>
      <OutlinedInput
        id={id}
        name={name}
        size="small"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        inputRef={inputRef}
        inputProps={{
          autoComplete,
          inputMode,
          maxLength,
          ...fieldAria(id, { description, error, required }),
        }}
      />
    </FieldShell>
  );
}
