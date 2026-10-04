import { describe, expect, it, rs } from '@rstest/core';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { DateField } from './DateField';
import { UiProvider } from './UiProvider';

const arabic = (ui: ReactNode) =>
  render(
    <UiProvider locale="ar" direction="rtl" colorScheme="light">
      {ui}
    </UiProvider>,
  );

const base = {
  id: 'issue',
  label: 'تاريخ الإصدار',
  openCalendarLabel: 'افتح التقويم',
  placeholder: { year: 'سنة', month: 'شهر', day: 'يوم' },
  locale: 'ar',
};

describe('shadcn DateField in Arabic', () => {
  it('takes Arabic-Indic digits from an Arabic keyboard and emits a Latin ISO date', async () => {
    const onChange = rs.fn();
    arabic(<DateField {...base} value="" onChange={onChange} />);
    const input = screen.getByLabelText(base.label);
    await userEvent.type(input, '٢٠٢٤٠١١٥');
    expect(onChange).toHaveBeenLastCalledWith('2024-01-15');
    expect(input).toHaveValue('2024-01-15');
  });

  it('heads the day columns with narrow weekday letters that fit them', async () => {
    arabic(<DateField {...base} value="2024-01-15" onChange={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: base.openCalendarLabel }));
    const grid = await screen.findByRole('grid');
    const headers = within(grid).getAllByRole('columnheader', { hidden: true });
    expect(headers.map((header) => header.textContent)).toEqual([
      'س',
      'ح',
      'ن',
      'ث',
      'ر',
      'خ',
      'ج',
    ]);
    expect(
      within(grid).getByRole('button', { name: /^الاثنين، 15 يناير 2024/ }),
    ).toBeInTheDocument();
  });
});
