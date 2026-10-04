import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState, type RefCallback } from 'react';
import { useController, useForm, type FieldPath, type UseControllerReturn } from 'react-hook-form';
import {
  ID_INFO_FIELDS,
  IdInfoFieldError,
  idInfoSchema,
  type IdInfoDraft,
  type IdInfoField,
  type IdInfoFieldErrorCode,
} from '../model';

export interface IdInfoFieldBinding {
  name: IdInfoField;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  ref: RefCallback<HTMLElement>;
  error: IdInfoFieldErrorCode | undefined;
}

export type ServerFieldErrors = Partial<Record<IdInfoField, IdInfoFieldErrorCode>>;

const ERROR_CODES: readonly string[] = Object.values(IdInfoFieldError);

function asErrorCode(message: string | undefined): IdInfoFieldErrorCode | undefined {
  return message !== undefined && ERROR_CODES.includes(message)
    ? (message as IdInfoFieldErrorCode)
    : undefined;
}

export function useIdInfoForm({
  values,
  onValuesChange,
}: {
  values: IdInfoDraft;
  onValuesChange: (values: IdInfoDraft) => void;
}) {
  const form = useForm<IdInfoDraft>({
    mode: 'all',
    defaultValues: values,
    resolver: zodResolver(idInfoSchema),
  });
  const [serverErrors, setServerErrors] = useState<ServerFieldErrors>({});
  const [restored] = useState(
    () => new Set<IdInfoField>(ID_INFO_FIELDS.filter((field) => values[field] !== '')),
  );

  const { trigger, getValues, setFocus } = form;
  useEffect(() => {
    if (restored.size > 0) void trigger([...restored]);
  }, [restored, trigger]);

  const idNumber = useController({ control: form.control, name: 'idNumber' });
  const nationality = useController({ control: form.control, name: 'nationality' });

  const bind = (
    name: IdInfoField,
    { field, fieldState }: UseControllerReturn<IdInfoDraft, FieldPath<IdInfoDraft>>,
  ): IdInfoFieldBinding => {
    const reached = fieldState.isTouched || fieldState.isDirty || restored.has(name);
    return {
      name,
      value: field.value,
      onChange: (value) => {
        field.onChange(value);
        setServerErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
        onValuesChange({ ...getValues(), [name]: value });
      },
      onBlur: field.onBlur,
      ref: field.ref,
      error: (reached ? asErrorCode(fieldState.error?.message) : undefined) ?? serverErrors[name],
    };
  };

  const showServerErrors = useCallback(
    (errors: ServerFieldErrors) => {
      setServerErrors(errors);
      const first = ID_INFO_FIELDS.find((field) => errors[field] !== undefined);
      if (first) setFocus(first);
      return first !== undefined;
    },
    [setFocus],
  );

  return {
    fields: { idNumber: bind('idNumber', idNumber), nationality: bind('nationality', nationality) },
    showServerErrors,
  };
}
