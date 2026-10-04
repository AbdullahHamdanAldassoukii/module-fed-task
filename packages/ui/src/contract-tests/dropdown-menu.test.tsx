import { describe, expect, it, rs } from '@rstest/core';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropdownMenu } from '../testing/kit';
import { renderKit } from '../testing/renderKit';

describe('DropdownMenu', () => {
  it('opens from a labelled trigger and selects an item', async () => {
    const onSelect = rs.fn();
    renderKit(
      <DropdownMenu
        triggerLabel="English"
        ariaLabel="Language"
        items={[
          { id: 'en', label: 'English', selected: true, onSelect: () => {} },
          { id: 'ar', label: 'العربية', onSelect },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'العربية' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
  it('marks the selected item checked', async () => {
    renderKit(
      <DropdownMenu
        triggerLabel="Light"
        ariaLabel="Theme"
        items={[
          { id: 'light', label: 'Light', selected: true, onSelect: () => {} },
          { id: 'dark', label: 'Dark', onSelect: () => {} },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Theme' }));
    expect(await screen.findByRole('menuitemradio', { name: 'Light' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
  it('shows triggerLabel on the trigger and renders its menu inside the UiProvider root', async () => {
    renderKit(
      <DropdownMenu
        triggerLabel="English"
        ariaLabel="Language"
        items={[
          { id: 'en', label: 'English', selected: true, onSelect: () => {} },
          { id: 'ar', label: 'العربية', onSelect: () => {} },
        ]}
      />,
      { direction: 'rtl' },
    );
    const trigger = screen.getByRole('button', { name: 'Language' });
    expect(trigger).toHaveTextContent('English');
    await userEvent.click(trigger);
    const menu = await screen.findByRole('menu', { name: 'Language' });
    expect(screen.getByTestId('ui-root')).toContainElement(menu);
  });
});
