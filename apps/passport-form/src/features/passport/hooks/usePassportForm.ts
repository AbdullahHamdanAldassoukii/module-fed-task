import { useEffect, useRef, useState } from 'react';
import { useController, useForm, type UseControllerReturn } from 'react-hook-form';
import type { PassportDraft, PassportFormState } from '@repo/passport-contract';
import {
  createFileReaderEncoder,
  isAbortError,
  mimeTypeOf,
  type FileEncoder,
} from '../lib/fileEncoder';
import {
  documentSelectionError,
  earliestExpiryDate,
  EMPTY_DOCUMENT,
  evaluatePassportForm,
  PassportFieldError,
  passportFormValuesFrom,
  sameFormState,
  type DocumentValue,
  type PassportField,
  type PassportFormValues,
} from '../model';

type TextFieldName = Exclude<PassportField, 'document'>;

interface Interaction {
  isTouched: boolean;
  isDirty: boolean;
}

export interface PassportFieldBinding {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  inputRef: (element: HTMLElement | null) => void;
  error: PassportFieldError | undefined;
}

export interface DocumentFieldBinding {
  value: DocumentValue;
  onFilesSelected: (files: File[]) => void;
  onRemove: () => void;
  onBlur: () => void;
  inputRef: (element: HTMLElement | null) => void;
  error: PassportFieldError | undefined;
}

export interface UsePassportFormOptions {
  initialValue: PassportDraft | undefined;
  onChange: (state: PassportFormState) => void;
  encoder?: FileEncoder;
}

const fileReaderEncoder = createFileReaderEncoder();

const shownError = (interaction: Interaction, error: PassportFieldError | undefined) =>
  interaction.isTouched || interaction.isDirty ? error : undefined;

function bindText(
  { field, fieldState }: UseControllerReturn<PassportFormValues, TextFieldName>,
  error: PassportFieldError | undefined,
): PassportFieldBinding {
  return {
    value: field.value,
    onChange: field.onChange,
    onBlur: field.onBlur,
    inputRef: field.ref,
    error: shownError(fieldState, error),
  };
}

const toFormState = (evaluation: ReturnType<typeof evaluatePassportForm>): PassportFormState =>
  evaluation.valid
    ? { valid: true, data: evaluation.data }
    : { valid: false, data: evaluation.data };

export function usePassportForm({
  initialValue,
  onChange,
  encoder = fileReaderEncoder,
}: UsePassportFormOptions) {
  const [defaultValues] = useState(() => passportFormValuesFrom(initialValue));
  const { control, setValue } = useForm<PassportFormValues>({ mode: 'onChange', defaultValues });
  const passportNumber = useController({ control, name: 'passportNumber' });
  const firstName = useController({ control, name: 'firstName' });
  const lastName = useController({ control, name: 'lastName' });
  const issueDate = useController({ control, name: 'issueDate' });
  const expiryDate = useController({ control, name: 'expiryDate' });
  const documentController = useController({ control, name: 'document' });

  const evaluation = evaluatePassportForm({
    passportNumber: passportNumber.field.value,
    firstName: firstName.field.value,
    lastName: lastName.field.value,
    issueDate: issueDate.field.value,
    expiryDate: expiryDate.field.value,
    document: documentController.field.value,
  });
  const state = toFormState(evaluation);

  const latestOnChange = useRef(onChange);
  const reported = useRef<PassportFormState | null>(null);
  useEffect(() => {
    latestOnChange.current = onChange;
  });
  useEffect(() => {
    if (reported.current && sameFormState(reported.current, state)) return;
    reported.current = state;
    latestOnChange.current(state);
  });

  const currentRead = useRef<AbortController | null>(null);
  useEffect(() => {
    const reads = currentRead;
    return () => {
      reads.current?.abort();
    };
  }, []);

  const setDocument = (value: DocumentValue) => {
    setValue('document', value, { shouldDirty: true, shouldTouch: true });
  };

  const selectFiles = (files: File[]) => {
    currentRead.current?.abort();
    const [file] = files;
    const refusal = documentSelectionError(files.map((each) => ({ mimeType: mimeTypeOf(each) })));
    if (refusal !== undefined || file === undefined) {
      setDocument({ status: 'rejected', error: refusal ?? PassportFieldError.REQUIRED });
      return;
    }
    const read = new AbortController();
    currentRead.current = read;
    setDocument({
      status: 'reading',
      fileName: file.name,
      mimeType: mimeTypeOf(file),
      sizeBytes: file.size,
    });
    encoder.encode(file, read.signal).then(
      (document) => {
        if (!read.signal.aborted) setDocument({ status: 'ready', document });
      },
      (error: unknown) => {
        if (read.signal.aborted || isAbortError(error)) return;
        setDocument({ status: 'rejected', error: PassportFieldError.READ_FAILED });
      },
    );
  };

  const removeDocument = () => {
    currentRead.current?.abort();
    setDocument(EMPTY_DOCUMENT);
  };

  const document: DocumentFieldBinding = {
    value: documentController.field.value,
    onFilesSelected: selectFiles,
    onRemove: removeDocument,
    onBlur: documentController.field.onBlur,
    inputRef: documentController.field.ref,
    error: shownError(documentController.fieldState, evaluation.errors.document),
  };

  return {
    passportNumber: bindText(passportNumber, evaluation.errors.passportNumber),
    firstName: bindText(firstName, evaluation.errors.firstName),
    lastName: bindText(lastName, evaluation.errors.lastName),
    issueDate: bindText(issueDate, evaluation.errors.issueDate),
    expiryDate: bindText(expiryDate, evaluation.errors.expiryDate),
    earliestExpiryDate: earliestExpiryDate(evaluation.data.issueDate),
    document,
  };
}
