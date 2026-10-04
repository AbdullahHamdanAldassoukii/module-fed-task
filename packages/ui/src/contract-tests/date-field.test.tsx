import { describe, expect, it, rs } from '@rstest/core';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { DateField } from '../testing/kit';
import { renderKit } from '../testing/renderKit';

const base = { id: 'issue', label: 'Issue date', openCalendarLabel: 'Open calendar', locale: 'en' };

// Day names differ per kit: react-day-picker labels day buttons "Monday, January 15th, 2024", MUI names day cells "15".
const dayRole = process.env.UI_KIT === 'mui' ? 'gridcell' : 'button';
const dayName = (n: number) =>
  process.env.UI_KIT === 'mui' ? String(n) : new RegExp(`January ${n}(?!\\d)`);

const arabicIndicDigit = /[٠-٩۰-۹]/;

// The labelled control differs per kit: the shadcn kit renders one text input; MUI renders a group
// of spinbuttons (year, month, day) named by the label, and keeps the text it shows in a hidden input.
const isMui = process.env.UI_KIT === 'mui';
const getField = (name: string | RegExp) =>
  isMui ? screen.getByRole('group', { name }) : screen.getByLabelText(name);
/** The input that holds the text the field shows ('' while empty). */
const textInput = (field: HTMLElement) =>
  field instanceof HTMLInputElement ? field : field.querySelector('input');
/** Focus is on the field: its input, or one of MUI's date parts (never its aria-hidden input). */
const expectFocusIn = (field: HTMLElement) => {
  expect(field.contains(document.activeElement)).toBe(true);
  expect(document.activeElement).not.toHaveAttribute('aria-hidden');
};
/** Empties the field from the keyboard; MUI's parts are cleared by select all, then Delete. */
const clearField = async (field: HTMLElement) => {
  if (!isMui) return userEvent.clear(field);
  await userEvent.click(field);
  await userEvent.keyboard('{Control>}a{/Control}{Delete}');
};

describe('DateField', () => {
  it('shows a controlled ISO value with Latin digits, also in Arabic', () => {
    renderKit(<DateField {...base} locale="ar" value="2024-01-15" onChange={() => {}} />, {
      direction: 'rtl',
      locale: 'ar',
    });
    expect(textInput(getField(/Issue date/))).toHaveValue('2024-01-15');
  });
  it('emits ISO for a complete date, raw text while incomplete, and empty when cleared', async () => {
    const onChange = rs.fn();
    renderKit(<DateField {...base} value="" onChange={onChange} />);
    const field = getField(/Issue date/);
    await userEvent.click(field);
    await userEvent.paste('2024-01-15');
    expect(onChange).toHaveBeenLastCalledWith('2024-01-15');
    onChange.mockClear();
    await clearField(field);
    expect(onChange).toHaveBeenLastCalledWith('');
  });
  it('reports an incomplete value as non-empty, non-ISO text', async () => {
    const onChange = rs.fn();
    renderKit(<DateField {...base} value="" onChange={onChange} />);
    await userEvent.click(getField(/Issue date/));
    // MUI's field takes a pasted date only when it is complete, so the digits are typed there.
    if (isMui) await userEvent.keyboard('20241');
    else await userEvent.paste('2024-1');
    expect(onChange).toHaveBeenCalled();
    const last: unknown = onChange.mock.calls.at(-1)?.[0];
    expect(typeof last).toBe('string');
    expect(last).not.toBe('');
    expect(last).not.toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('shows each new value from the parent, also a reset to the value it started from', async () => {
    function Resettable() {
      const [value, setValue] = useState('');
      return (
        <>
          <DateField {...base} value={value} onChange={setValue} />
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
    renderKit(<Resettable />);
    const field = getField(/Issue date/);
    await userEvent.click(field);
    // MUI's field takes a pasted date only when it is complete, so the digits are typed there.
    if (isMui) await userEvent.keyboard('20240');
    else await userEvent.paste('2024-0');
    expect(textInput(field)).toHaveValue(isMui ? '2024-00-DD' : '2024-0');
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(textInput(getField(/Issue date/))).toHaveValue('');
  });
  it('picks a date from the calendar and respects min', async () => {
    const onChange = rs.fn();
    renderKit(<DateField {...base} value="2024-01-10" min="2024-01-10" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    const grid = await screen.findByRole('grid');
    expect(grid).toBeInTheDocument();
    await userEvent.click(screen.getByRole(dayRole, { name: dayName(15) }));
    expect(onChange).toHaveBeenLastCalledWith('2024-01-15');
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(await screen.findByRole(dayRole, { name: dayName(5) })).toBeDisabled();
  });
  it('wires error and required', () => {
    renderKit(<DateField {...base} value="" onChange={() => {}} error="Required" required />);
    const field = getField(/Issue date/);
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field.getAttribute('aria-describedby')).toContain('issue-error');
  });
  it('hands inputRef the focusable control, as a ref object or a callback', () => {
    const objectRef = createRef<HTMLElement>();
    const callbackRef = rs.fn<(node: HTMLElement | null) => void>();
    renderKit(
      <>
        <DateField
          {...base}
          id="a"
          label="First"
          value=""
          onChange={() => {}}
          inputRef={objectRef}
        />
        <DateField
          {...base}
          id="b"
          label="Second"
          value=""
          onChange={() => {}}
          inputRef={callbackRef}
        />
      </>,
    );
    expect(objectRef.current).toBeInstanceOf(HTMLElement);
    objectRef.current?.focus();
    expectFocusIn(getField('First'));
    // An input contains only itself, so for the shadcn kit this is that input; MUI hands over the
    // hidden input inside its field.
    const handed = callbackRef.mock.lastCall?.[0] ?? null;
    expect(handed).toBeInstanceOf(HTMLElement);
    expect(getField('Second').contains(handed)).toBe(true);
  });
  it('takes typing each time inputRef is focused, also when focused twice in a row', async () => {
    // A form focuses its first invalid field at once, and again a moment later.
    const onChange = rs.fn();
    const inputRef = createRef<HTMLElement>();
    renderKit(<DateField {...base} value="" onChange={onChange} inputRef={inputRef} />);
    const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));
    inputRef.current?.focus();
    await nextTask();
    inputRef.current?.focus();
    await nextTask();
    expectFocusIn(getField(/Issue date/));
    await userEvent.keyboard('20240115');
    expect(onChange).toHaveBeenLastCalledWith('2024-01-15');
  });
  it('opens the calendar on the selected day, and arrow keys follow the reading direction', async () => {
    renderKit(<DateField {...base} value="2024-01-15" onChange={() => {}} />, {
      direction: 'rtl',
    });
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    await waitFor(() => {
      expect(screen.getByRole(dayRole, { name: dayName(15) })).toHaveFocus();
    });
    // In RTL the next day sits to the left.
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole(dayRole, { name: dayName(16) })).toHaveFocus();
  });
  it('shows Latin digits in the Arabic calendar too', async () => {
    renderKit(<DateField {...base} locale="ar" value="2024-01-15" onChange={() => {}} />, {
      direction: 'rtl',
      locale: 'ar',
    });
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    const grid = await screen.findByRole('grid');
    expect(within(grid).getByText('15')).toBeInTheDocument();
    const root = screen.getByTestId('ui-root');
    const ariaLabels = Array.from(root.querySelectorAll('[aria-label]'), (el) =>
      el.getAttribute('aria-label'),
    ).join(' ');
    expect(root.textContent).toContain('2024');
    expect(root.textContent).not.toMatch(arabicIndicDigit);
    expect(ariaLabels).not.toMatch(arabicIndicDigit);
  });
  it('reports blur when focus leaves the field, not when it moves to its calendar', async () => {
    const onBlur = rs.fn();
    renderKit(
      <>
        <DateField {...base} value="2024-01-10" onChange={() => {}} onBlur={onBlur} />
        <button type="button">Next</button>
      </>,
    );
    await userEvent.click(getField(/Issue date/));
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    await userEvent.click(await screen.findByRole(dayRole, { name: dayName(15) }));
    await waitFor(() => {
      expect(screen.queryByRole('grid')).toBeNull();
    });
    // Focus goes back into the field once the calendar has closed.
    await waitFor(() => {
      expect(document.body).not.toHaveFocus();
    });
    expect(onBlur).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
  it('brings focus back to the field once a day is picked, also when opened from elsewhere', async () => {
    renderKit(
      <>
        <button type="button">Before</button>
        <DateField {...base} value="2024-01-10" onChange={() => {}} />
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Before' }));
    const calendarButton = screen.getByRole('button', { name: 'Open calendar' });
    await userEvent.click(calendarButton);
    await userEvent.click(await screen.findByRole(dayRole, { name: dayName(15) }));
    await waitFor(() => {
      expect(screen.queryByRole('grid')).toBeNull();
    });
    // On the calendar button, or on the field it belongs to.
    await waitFor(() => {
      const active = document.activeElement;
      expect(active === calendarButton || getField(/Issue date/).contains(active)).toBe(true);
    });
  });
  it('keeps focus in the input while its calendar button is pressed', async () => {
    // Safari does not focus a pressed button: a press that took focus from the input would
    // report a blur with nowhere to go, before the calendar opens.
    const user = userEvent.setup();
    const onBlur = rs.fn();
    renderKit(<DateField {...base} value="" onChange={() => {}} onBlur={onBlur} />);
    const calendarButton = screen.getByRole('button', { name: 'Open calendar' });
    await user.click(getField(/Issue date/));
    // The input, or the MUI date part that took focus.
    const focused = document.activeElement;
    await user.pointer({ keys: '[MouseLeft>]', target: calendarButton });
    expect(document.activeElement).toBe(focused);
    await user.pointer({ keys: '[/MouseLeft]', target: calendarButton });
    expect(await screen.findByRole('grid')).toBeInTheDocument();
    expect(onBlur).not.toHaveBeenCalled();
  });
  it('renders its calendar inside the UiProvider root', async () => {
    renderKit(<DateField {...base} value="" onChange={() => {}} />, { direction: 'rtl' });
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByTestId('ui-root')).toContainElement(await screen.findByRole('grid'));
  });
});
