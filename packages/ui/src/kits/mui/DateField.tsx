import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { type Dayjs } from 'dayjs';
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type Ref,
} from 'react';
import type { DateFieldProps, DatePlaceholder } from '../../api';
import { fromIsoDate, toIsoDate } from '../../shared/dateText';
import { useElementRef } from '../../shared/element-ref';
import { dayjsLocaleFor, registerDayjsLocales } from './dayjsLocale';
import { FieldShell, fieldAria, fieldLabelId } from './FieldShell';
import { pickersTextFor } from './pickersText';
import { usePortalContainer } from './portal';
import { visuallyHidden } from './VisuallyHidden';

registerDayjsLocales();

const FORMAT = 'YYYY-MM-DD';

function toDayjs(value: string | undefined): Dayjs | null {
  const date = value ? toIsoDate(value) : null;
  return date ? dayjs(date) : null;
}

const ShownTextContext = createContext<(text: string) => void>(() => undefined);

type HiddenInputProps = ComponentPropsWithoutRef<'input'> & { ownerState?: unknown };

const ReportingHiddenInput = forwardRef<HTMLInputElement, HiddenInputProps>(
  function ReportingHiddenInput({ value, style, onFocus, ownerState: _ownerState, ...props }, ref) {
    const report = useContext(ShownTextContext);
    const text = typeof value === 'string' ? value : '';
    useEffect(() => {
      report(text);
    }, [report, text]);
    const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
      onFocus?.(event);
      const firstPart = event.currentTarget
        .closest('[role="group"]')
        ?.querySelector<HTMLElement>('[role="spinbutton"]');
      if (!firstPart) return;
      firstPart.focus();
      const range = document.createRange();
      range.selectNodeContents(firstPart);
      const selection = document.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    };
    return (
      <input
        ref={ref}
        value={value}
        style={{ ...visuallyHidden, ...style }}
        {...props}
        onFocus={handleFocus}
      />
    );
  },
);

interface Shown {
  date: Dayjs | null;
  text: string;
  value: string;
  generation: number;
}

function shownFor(value: string, generation: number): Shown {
  const date = toDayjs(value);
  return { date, text: date ? fromIsoDate(date.toDate()) : '', value, generation };
}

export function DateField({
  id,
  label,
  description,
  error,
  required,
  disabled,
  value,
  onChange,
  onBlur,
  locale,
  min,
  max,
  name,
  openCalendarLabel,
  placeholder,
  inputRef,
}: DateFieldProps) {
  const calendarId = `${id}-calendar`;
  const [shown, setShown] = useState(() => shownFor(value, 0));
  if (shown.value !== value) {
    if (value === shown.text) {
      setShown({ ...shown, value });
    } else {
      const next = shownFor(value, shown.generation);
      if (next.date === null && shown.date === null && shown.text !== '') next.generation += 1;
      setShown(next);
    }
  }

  const latest = useRef({ text: shown.text, onChange });
  useLayoutEffect(() => {
    latest.current = { text: shown.text, onChange };
  });
  const [reportText] = useState(() => (text: string) => {
    if (text === latest.current.text) return;
    setShown((previous) => ({ ...previous, text }));
    latest.current.onChange(text);
  });

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    const calendar = document.getElementById(calendarId);
    if (event.currentTarget.contains(next) || calendar?.contains(next)) return;
    onBlur?.();
  };

  return (
    <FieldShell id={id} label={label} description={description} error={error} required={required}>
      <ShownTextContext.Provider value={reportText}>
        <div onBlur={handleBlur}>
          {/* MUI retains date parts when an empty value is reset. */}
          <DatePickerField
            key={shown.generation}
            id={id}
            name={name}
            date={shown.date}
            onDateChange={(date) => {
              setShown((previous) => ({ ...previous, date }));
            }}
            minDate={toDayjs(min)}
            maxDate={toDayjs(max)}
            disabled={disabled}
            locale={locale}
            invalid={Boolean(error)}
            aria={fieldAria(id, { description, error, required })}
            openCalendarLabel={openCalendarLabel}
            placeholder={placeholder}
            calendarId={calendarId}
            inputRef={inputRef}
          />
        </div>
      </ShownTextContext.Provider>
    </FieldShell>
  );
}

interface DatePickerFieldProps {
  id: string;
  name: string | undefined;
  date: Dayjs | null;
  onDateChange: (date: Dayjs | null) => void;
  minDate: Dayjs | null;
  maxDate: Dayjs | null;
  disabled: boolean | undefined;
  locale: string;
  invalid: boolean;
  aria: ReturnType<typeof fieldAria>;
  openCalendarLabel: string;
  placeholder: DatePlaceholder;
  calendarId: string;
  inputRef: Ref<HTMLElement> | undefined;
}

function DatePickerField({
  id,
  name,
  date,
  onDateChange,
  minDate,
  maxDate,
  disabled,
  locale,
  invalid,
  aria,
  openCalendarLabel,
  placeholder,
  calendarId,
  inputRef,
}: DatePickerFieldProps) {
  const container = usePortalContainer();
  const hiddenInputRef = useElementRef<HTMLInputElement>(inputRef);
  const { year, month, day } = placeholder;
  const localeText = useMemo(
    () => pickersTextFor(locale, { year, month, day }),
    [locale, year, month, day],
  );
  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      adapterLocale={dayjsLocaleFor(locale)}
      localeText={localeText}
    >
      <DesktopDatePicker
        value={date}
        onChange={onDateChange}
        format={FORMAT}
        minDate={minDate ?? undefined}
        maxDate={maxDate ?? undefined}
        disabled={disabled}
        inputRef={hiddenInputRef}
        slotProps={{
          textField: {
            id,
            name,
            size: 'small',
            fullWidth: true,
            error: invalid,
            slots: { htmlInput: ReportingHiddenInput },
            slotProps: {
              input: {
                'aria-labelledby': fieldLabelId(id),
                'aria-describedby': aria['aria-describedby'],
                slotProps: {
                  sectionContent: {
                    'aria-invalid': aria['aria-invalid'],
                    'aria-required': aria['aria-required'],
                  },
                },
              },
            },
          },
          openPickerButton: {
            'aria-label': openCalendarLabel,
            onMouseDown: (event) => {
              event.preventDefault();
              const button = event.currentTarget;
              const focusInField = button
                .closest('[role="group"]')
                ?.contains(document.activeElement);
              if (!focusInField) button.focus();
            },
          },
          popper: { id: calendarId, container },
        }}
      />
    </LocalizationProvider>
  );
}
