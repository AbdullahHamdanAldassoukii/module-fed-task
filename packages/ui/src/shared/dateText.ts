import { format, isValid, parseISO } from 'date-fns';

const ISO = 'yyyy-MM-dd';
const ISO_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

const NON_LATIN_DIGIT = /[٠-٩۰-۹]/g;

function toLatinDigits(text: string): string {
  return text.replace(NON_LATIN_DIGIT, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code - (code >= 0x06f0 ? 0x06f0 : 0x0660));
  });
}

function joinDateParts(digits: string): string {
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function maskDateText(text: string): string {
  const latin = toLatinDigits(text);
  const digits = latin.replace(/\D/g, '').slice(0, 8);
  const typedSeparator = /[-/.]$/.test(latin) && (digits.length === 4 || digits.length === 6);
  return joinDateParts(digits) + (typedSeparator ? '-' : '');
}

export function toIsoDate(text: string): Date | null {
  if (!ISO_SHAPE.test(text)) return null;
  const date = parseISO(text);
  return isValid(date) && format(date, ISO) === text ? date : null;
}

export function fromIsoDate(date: Date): string {
  return format(date, ISO);
}
