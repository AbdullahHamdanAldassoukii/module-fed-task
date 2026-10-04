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
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type Ref,
} from 'react';
import type { DateFieldProps } from '../../api';
import { fromIsoDate, toIsoDate } from '../../shared/dateText';
import { useElementRef } from '../../shared/element-ref';
import { dayjsLocaleFor, registerDayjsLocales } from './dayjsLocale';
import { FieldShell, fieldAria, fieldLabelId } from './FieldShell';
import { pickersTextFor } from './pickersText';
import { usePortalContainer } from './portal';
import { visuallyHidden } from './VisuallyHidden';

registerDayjsLocales();

const FORMAT = 'YYYY-MM-DD';

/** A complete, real YYYY-MM-DD as MUI's value; anything else is no date. */
function toDayjs(value: string | undefined): Dayjs | null {
  const date = value ? toIsoDate(value) : null;
  return date ? dayjs(date) : null;
}

/** Receives the text the field shows. */
const ShownTextContext = createContext<(text: string) => void>(() => undefined);

type HiddenInputProps = ComponentPropsWithoutRef<'input'> & { ownerState?: unknown };

/**
 * MUI's hidden input holds the text the field shows ('' while every part is empty). MUI reports
 * no change while an empty field is only partly typed, so this input reports its text instead.
 *
 * It is also the element `inputRef` gets. MUI moves focus from it to the first date part only
 * when the field was not focused yet; focused again (a form focuses its first invalid field twice),
 * focus would stay on this input, which screen readers skip and which takes no typing. So focus
 * moves on to the first part every time, at once.
 */
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
      // Focusing this input took the page selection out of the part. MUI selects a part's text
      // again only when its own state changes, which it does not when the field was focused
      // already; Chrome then keeps a bare caret there, and the first digit typed is lost.
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
  /** MUI's value: a date, an invalid date while a typed one is incomplete, or none. */
  date: Dayjs | null;
  /** The text the field shows. */
  text: string;
  /** The value the parent last gave. */
  value: string;
  /** A new one rebuilds the field (see below). */
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
  inputRef,
}: DateFieldProps) {
  const calendarId = `${id}-calendar`;
  const [shown, setShown] = useState(() => shownFor(value, 0));
  // A new value from the parent (a reset, a restore) replaces what the field shows. The text the
  // field already shows, echoed back, does not: an incomplete date stays on screen.
  if (shown.value !== value) {
    if (value === shown.text) {
      setShown({ ...shown, value });
    } else {
      const next = shownFor(value, shown.generation);
      // MUI rebuilds its parts when its value changes. No date replacing no date is no change
      // to MUI, so typed parts would stay: a new field is built instead.
      if (next.date === null && shown.date === null && shown.text !== '') next.generation += 1;
      setShown(next);
    }
  }

  const latest = useRef({ text: shown.text, onChange });
  useLayoutEffect(() => {
    latest.current = { text: shown.text, onChange };
  });
  // Stable, so the hidden input reports only when its text changes.
  const [reportText] = useState(() => (text: string) => {
    if (text === latest.current.text) return;
    setShown((previous) => ({ ...previous, text }));
    // '' | YYYY-MM-DD | the incomplete text as shown (e.g. 2024-MM-DD); the form decides.
    latest.current.onChange(text);
  });

  // The field, its calendar button and the open calendar are one field: moving between them is
  // not leaving it. The calendar is found by id: MUI focuses a day before React sets its refs.
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
  calendarId: string;
  inputRef: Ref<HTMLElement> | undefined;
}

/** MUI's date picker in the field's locale, wired to its label, hint, error and popup container. */
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
  calendarId,
  inputRef,
}: DatePickerFieldProps) {
  const container = usePortalContainer();
  // The parent's ref gets MUI's hidden input, which hands focus on to the first date part (see
  // ReportingHiddenInput). Rebuilding the field (a new key) remounts this component, so the ref
  // follows the new input.
  const hiddenInputRef = useElementRef<HTMLInputElement>(inputRef);
  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      adapterLocale={dayjsLocaleFor(locale)}
      localeText={pickersTextFor(locale)}
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
              // The group of date parts: named by the field label, described by its hint and error.
              input: {
                'aria-labelledby': fieldLabelId(id),
                'aria-describedby': aria['aria-describedby'],
                // The parts are the spinbuttons that take focus.
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
            // Safari does not focus a pressed button, so the field would report a blur with nowhere
            // to go; focus stays in the field until the calendar takes it. Pressed from outside the
            // field, the button takes focus, so MUI brings focus back to it after a pick.
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
