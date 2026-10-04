import type { PickersLocaleText } from '@mui/x-date-pickers/locales';
import type { DatePlaceholder } from '../../api';

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

export function pickersTextFor(
  locale: string,
  placeholder: DatePlaceholder,
): Partial<PickersLocaleText> {
  return {
    ...(locale === 'ar' ? arabic : undefined),
    fieldYearPlaceholder: () => placeholder.year,
    fieldMonthPlaceholder: () => placeholder.month,
    fieldDayPlaceholder: () => placeholder.day,
  };
}
