import { describe, expect, it } from '@rstest/core';
import { screen, within } from '@testing-library/react';
import { Stepper } from '../testing/kit';
import { renderKit } from '../testing/renderKit';

describe('Stepper', () => {
  it('is a labelled nav with an ordered list and aria-current on the current step', () => {
    renderKit(
      <Stepper
        ariaLabel="Progress"
        steps={[
          { id: 'p', label: 'Passport', status: 'complete' },
          { id: 'i', label: 'ID info', status: 'current' },
        ]}
      />,
    );
    const nav = screen.getByRole('navigation', { name: 'Progress' });
    const items = within(nav).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
    expect(within(items[0]!).getByText(/complete/i)).toBeInTheDocument();
  });
  it('shows the end state with every step complete and none current', () => {
    renderKit(
      <Stepper
        ariaLabel="Progress"
        steps={[
          { id: 'p', label: 'Passport', status: 'complete' },
          { id: 'i', label: 'ID info', status: 'complete' },
        ]}
      />,
    );
    const items = within(screen.getByRole('navigation', { name: 'Progress' })).getAllByRole(
      'listitem',
    );
    for (const item of items) {
      expect(item).not.toHaveAttribute('aria-current');
      expect(within(item).getByText(/complete/i)).toBeInTheDocument();
    }
  });
  it('reads the status words it is given, so they follow the page language', () => {
    renderKit(
      <Stepper
        ariaLabel="التقدم"
        statusLabels={{ complete: 'مكتمل', current: 'الحالية', upcoming: 'القادمة' }}
        steps={[
          { id: 'p', label: 'جواز السفر', status: 'complete' },
          { id: 'i', label: 'بيانات الهوية', status: 'current' },
          { id: 's', label: 'الملخص', status: 'upcoming' },
        ]}
      />,
      { direction: 'rtl', locale: 'ar' },
    );
    const nav = screen.getByRole('navigation', { name: 'التقدم' });
    const [complete, current, upcoming] = within(nav).getAllByRole('listitem');
    expect(within(complete!).getByText('(مكتمل)')).toBeInTheDocument();
    expect(within(current!).getByText('(الحالية)')).toBeInTheDocument();
    expect(within(upcoming!).getByText('(القادمة)')).toBeInTheDocument();
    expect(within(nav).queryByText(/complete|current|upcoming/i)).toBeNull();
  });
});
