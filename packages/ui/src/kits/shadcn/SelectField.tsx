import { useState } from 'react';
import type { SelectFieldProps } from '../../api';
import { useElementRef } from '../../shared/element-ref';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import { FieldShell, fieldAria } from './FieldShell';

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
  const triggerRef = useElementRef<HTMLButtonElement>(inputRef);
  const [open, setOpen] = useState(false);
  return (
    <FieldShell id={id} label={label} description={description} error={error} required={required}>
      <Select
        value={value}
        onValueChange={onChange}
        open={open}
        onOpenChange={setOpen}
        name={name}
        disabled={disabled}
      >
        <SelectTrigger
          ref={triggerRef}
          id={id}
          className="w-full"
          onBlur={() => {
            if (!open) onBlur?.();
          }}
          {...fieldAria(id, { description, error, required })}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}
