import type { TextFieldProps } from '../../api';
import { Input } from './components/ui/input';
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
      <Input
        ref={inputRef}
        id={id}
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onBlur={onBlur}
        disabled={disabled}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        maxLength={maxLength}
        {...fieldAria(id, { description, error, required })}
      />
    </FieldShell>
  );
}
