import type { PickersLocaleText } from '@mui/x-date-pickers/locales';

/**
 * MUI X ships no Arabic texts. These are the ones its desktop date picker reads here: the names
 * of the date parts and the calendar's navigation (the open button takes the field's own label).
 */
const arabic: Partial<PickersLocaleText> = {
  previousMonth: 'الشهر السابق',
  nextMonth: 'الشهر التالي',
  calendarViewSwitchingButtonAriaLabel: (view) =>
    view === 'year'
      ? 'عرض السنوات مفتوح، انتقل إلى عرض التقويم'
      : 'عرض التقويم مفتوح، انتقل إلى عرض السنوات',
  year: 'السنة',
  month: 'الشهر',
  day: 'اليوم',
  empty: 'فارغ',
};

export function pickersTextFor(locale: string): Partial<PickersLocaleText> | undefined {
  return locale === 'ar' ? arabic : undefined;
}
