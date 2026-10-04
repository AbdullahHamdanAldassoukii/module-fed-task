import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useRef, useState, type FocusEvent } from 'react';
import type { Matcher } from 'react-day-picker';
import { ar, enUS } from 'react-day-picker/locale';
import type { DateFieldProps } from '../../api';
import { fromIsoDate, maskDateText, toIsoDate } from '../../shared/dateText';
import { useElementRef } from '../../shared/element-ref';
import { Button } from './components/ui/button';
import { Calendar } from './components/ui/calendar';
import { Input } from './components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { FieldShell, fieldAria } from './FieldShell';

const START_MONTH = new Date(1950, 0);
const END_MONTH = new Date(new Date().getFullYear() + 20, 11);

const LRM = '\u200E';
const placeholderText = ({ year, month, day }: DateFieldProps['placeholder']) =>
  LRM + [year, month, day].join(`${LRM}-${LRM}`);

const arabicFormatters = {
  formatWeekdayName: (weekday: Date) => format(weekday, 'ccccc', { locale: ar }),
};

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
  const ownInputRef = useElementRef<HTMLInputElement>(inputRef);
  const fieldRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const isArabic = locale === 'ar';
  const [typed, setTyped] = useState({ text: value, value });
  if (typed.value !== value) setTyped({ text: value, value });
  const text = typed.value === value ? typed.text : value;

  const selected = toIsoDate(text) ?? undefined;
  const minDate = min ? toIsoDate(min) : null;
  const maxDate = max ? toIsoDate(max) : null;
  const outOfRange: Matcher[] = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ];

  const update = (raw: string) => {
    const masked = maskDateText(raw);
    setTyped({ text: masked, value });
    onChange(masked);
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    const calendar = calendarRef.current?.closest('[data-slot="popover-content"]');
    if (fieldRef.current?.contains(next) || calendar?.contains(next)) return;
    onBlur?.();
  };

  return (
    <FieldShell id={id} label={label} description={description} error={error} required={required}>
      <div ref={fieldRef} className="flex gap-2" onBlur={handleBlur}>
        <Input
          ref={ownInputRef}
          id={id}
          name={name}
          value={text}
          onChange={(event) => {
            update(event.target.value);
          }}
          disabled={disabled}
          inputMode="numeric"
          placeholder={placeholderText(placeholder)}
          autoComplete="off"
          dir="ltr"
          className="rtl:text-right"
          {...fieldAria(id, { description, error, required })}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={openCalendarLabel}
              disabled={disabled}
              onMouseDown={(event) => {
                event.preventDefault();
              }}
            >
              <CalendarIcon aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            aria-label={label}
            className="w-auto p-0"
            align="end"
            onOpenAutoFocus={(event) => {
              const day = calendarRef.current?.querySelector<HTMLElement>(
                '[role="grid"] [tabindex="0"]',
              );
              if (!day) return;
              event.preventDefault();
              day.focus();
            }}
          >
            <div ref={calendarRef}>
              <Calendar
                mode="single"
                required
                selected={selected}
                defaultMonth={selected ?? minDate ?? undefined}
                onSelect={(date) => {
                  update(fromIsoDate(date));
                  setOpen(false);
                }}
                disabled={outOfRange}
                locale={isArabic ? ar : enUS}
                formatters={isArabic ? arabicFormatters : undefined}
                numerals="latn"
                captionLayout="dropdown"
                startMonth={START_MONTH}
                endMonth={END_MONTH}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </FieldShell>
  );
}
