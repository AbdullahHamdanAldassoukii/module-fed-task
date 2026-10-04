import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useImperativeHandle, useRef } from 'react';
import type { SelectFieldProps } from '../../api';
import { FieldShell, fieldAria, fieldLabelId } from './FieldShell';
import { usePortalContainer } from './portal';

export function SelectField({
  id,
  label,
  description,
  error,
  required,
  disabled,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  name,
  inputRef,
}: SelectFieldProps) {
  const container = usePortalContainer();
  const rootRef = useRef<HTMLDivElement>(null);
  useImperativeHandle<HTMLElement | null, HTMLElement | null>(
    inputRef,
    () => rootRef.current?.querySelector<HTMLElement>('[role="combobox"]') ?? null,
    [],
  );
  const aria = fieldAria(id, { description, error, required });
  return (
    <FieldShell id={id} label={label} description={description} error={error} required={required}>
      <Select
        ref={rootRef}
        id={id}
        labelId={fieldLabelId(id)}
        name={name}
        size="small"
        displayEmpty
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onBlur={() => {
          onBlur?.();
        }}
        disabled={disabled}
        required={required}
        error={Boolean(error)}
        aria-describedby={aria['aria-describedby']}
        renderValue={(selected) =>
          selected ? (
            (options.find((option) => option.value === selected)?.label ?? selected)
          ) : (
            <span style={{ opacity: 0.6 }}>{placeholder}</span>
          )
        }
        MenuProps={{ container }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FieldShell>
  );
}
