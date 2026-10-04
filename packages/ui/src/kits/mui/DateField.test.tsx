import { describe, expect, it, rs } from '@rstest/core';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';
import preParsePostFormat from 'dayjs/plugin/preParsePostFormat';
import { createRef, useState, type ReactNode } from 'react';
import { DateField } from './DateField';
import { UiProvider } from './UiProvider';

// dayjs is shared with the host, which may turn on its digit conversion; Arabic dates stay Latin.
dayjs.extend(preParsePostFormat);

const arabicIndicDigit = /[٠-٩۰-۹]/;

const renderIn = (locale: 'ar' | 'en', ui: ReactNode) =>
  render(
    <UiProvider locale={locale} direction={locale === 'ar' ? 'rtl' : 'ltr'} colorScheme="light">
      {ui}
    </UiProvider>,
  );

const arabic = {
  id: 'issue',
  label: 'تاريخ الإصدار',
  openCalendarLabel: 'افتح التقويم',
  locale: 'ar',
};
const english = {
  id: 'issue',
  label: 'Issue date',
  openCalendarLabel: 'Open calendar',
  locale: 'en',
};

const parts = () => screen.getAllByRole('spinbutton');

describe('MUI DateField', () => {
  it('shows Latin digits in Arabic, also when the host converts dayjs digits', async () => {
    renderIn('ar', <DateField {...arabic} value="2024-01-15" onChange={() => {}} />);
    expect(parts().map((part) => part.textContent)).toEqual(['2024', '01', '15']);
    await userEvent.click(screen.getByRole('button', { name: arabic.openCalendarLabel }));
    const grid = await screen.findByRole('grid');
    expect(within(grid).getByRole('gridcell', { name: '15' })).toBeInTheDocument();
    const root = screen.getByTestId('ui-root');
    expect(root.textContent).toContain('يناير 2024');
    expect(root.textContent).not.toMatch(arabicIndicDigit);
    const ariaLabels = Array.from(root.querySelectorAll('[aria-label]'), (el) =>
      el.getAttribute('aria-label'),
    ).join(' ');
    expect(ariaLabels).not.toMatch(arabicIndicDigit);
  });

  it('names the date parts and the calendar buttons in Arabic', async () => {
    renderIn('ar', <DateField {...arabic} value="2024-01-15" onChange={() => {}} />);
    expect(parts().map((part) => part.getAttribute('aria-label'))).toEqual([
      'السنة',
      'الشهر',
      'اليوم',
    ]);
    await userEvent.click(screen.getByRole('button', { name: arabic.openCalendarLabel }));
    expect(await screen.findByRole('button', { name: 'الشهر السابق' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'الشهر التالي' })).toBeInTheDocument();
  });

  it('follows its own locale, not only the page around it', () => {
    renderIn('en', <DateField {...arabic} value="" onChange={() => {}} />);
    expect(parts().map((part) => part.getAttribute('aria-label'))).toEqual([
      'السنة',
      'الشهر',
      'اليوم',
    ]);
  });

  it('heads the day columns with one-letter Arabic week days, from Saturday', async () => {
    renderIn('ar', <DateField {...arabic} value="2024-01-15" onChange={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: arabic.openCalendarLabel }));
    const grid = await screen.findByRole('grid');
    const headers = within(grid).getAllByRole('columnheader');
    expect(headers.map((header) => header.textContent)).toEqual([
      'س',
      'ح',
      'ن',
      'ث',
      'ر',
      'خ',
      'ج',
    ]);
  });

  it('marks every date part required and invalid with the field', () => {
    renderIn(
      'en',
      <DateField {...english} value="" onChange={() => {}} required error="Required" />,
    );
    for (const part of parts()) {
      expect(part).toHaveAttribute('aria-required', 'true');
      expect(part).toHaveAttribute('aria-invalid', 'true');
    }
  });

  it('emits ISO once a date is typed part by part', async () => {
    const onChange = rs.fn();
    renderIn('en', <DateField {...english} value="" onChange={onChange} />);
    await userEvent.click(screen.getByRole('group', { name: english.label }));
    await userEvent.keyboard('20240115');
    expect(onChange).toHaveBeenLastCalledWith('2024-01-15');
  });

  it('selects the first date part each time inputRef is focused, so no typed digit is lost', async () => {
    const ref = createRef<HTMLElement>();
    renderIn('en', <DateField {...english} value="" onChange={() => {}} inputRef={ref} />);
    // Focusing an input takes the page selection out of the date part, as Chrome does.
    ref.current?.addEventListener('focusin', () => {
      document.getSelection()?.removeAllRanges();
    });
    const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));
    ref.current?.focus();
    await nextTask();
    ref.current?.focus();
    await nextTask();
    expect(document.activeElement).toBe(parts()[0]);
    expect(document.getSelection()?.toString()).toBe('YYYY');
  });

  it('keeps inputRef on the field when a reset rebuilds it', async () => {
    const ref = createRef<HTMLElement>();
    function Resettable() {
      const [value, setValue] = useState('');
      return (
        <>
          <DateField {...english} value={value} onChange={setValue} inputRef={ref} />
          <button
            type="button"
            onClick={() => {
              setValue('');
            }}
          >
            Reset
          </button>
        </>
      );
    }
    renderIn('en', <Resettable />);
    await userEvent.click(screen.getByRole('group', { name: english.label }));
    await userEvent.keyboard('2024');
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    const field = screen.getByRole('group', { name: english.label });
    expect(field).toContainElement(ref.current);
    ref.current?.focus();
    expect(field.contains(document.activeElement)).toBe(true);
  });
});
