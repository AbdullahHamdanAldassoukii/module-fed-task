import { describe, expect, it, rs } from '@rstest/core';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { SelectField } from '../testing/kit';
import { renderKit } from '../testing/renderKit';

const options = [
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'EG', label: 'Egypt' },
  { value: 'SA', label: 'Saudi Arabia' },
];

describe('SelectField', () => {
  it('shows the placeholder when empty and the selected label when set', () => {
    const { rerender } = renderKit(
      <SelectField
        id="nat"
        label="Nationality"
        placeholder="Select nationality"
        options={options}
        value=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Nationality')).toHaveTextContent('Select nationality');
    rerender(
      <SelectField
        id="nat"
        label="Nationality"
        placeholder="Select nationality"
        options={options}
        value="EG"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Nationality')).toHaveTextContent('Egypt');
  });
  it('opens, lists options and reports a choice', async () => {
    const onChange = rs.fn();
    renderKit(
      <SelectField
        id="nat"
        label="Nationality"
        placeholder="Pick"
        options={options}
        value=""
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByLabelText('Nationality'));
    await userEvent.click(await screen.findByRole('option', { name: 'Saudi Arabia' }));
    expect(onChange).toHaveBeenCalledWith('SA');
  });
  it('wires error state', () => {
    renderKit(
      <SelectField
        id="nat"
        label="Nationality"
        placeholder="Pick"
        options={options}
        value=""
        onChange={() => {}}
        error="Required"
      />,
    );
    expect(screen.getByLabelText('Nationality')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Required')).toHaveAttribute('id', 'nat-error');
  });
  it('hands inputRef the focusable control, as a ref object or a callback', () => {
    const objectRef = createRef<HTMLElement>();
    const callbackRef = rs.fn<(node: HTMLElement | null) => void>();
    renderKit(
      <>
        <SelectField
          id="a"
          label="First"
          placeholder="Pick"
          options={options}
          value=""
          onChange={() => {}}
          inputRef={objectRef}
        />
        <SelectField
          id="b"
          label="Second"
          placeholder="Pick"
          options={options}
          value=""
          onChange={() => {}}
          inputRef={callbackRef}
        />
      </>,
    );
    expect(objectRef.current).toBeInstanceOf(HTMLElement);
    objectRef.current?.focus();
    expect(screen.getByLabelText('First')).toHaveFocus();
    expect(callbackRef).toHaveBeenLastCalledWith(screen.getByLabelText('Second'));
  });
  it('reports blur when focus leaves the field, not when its list opens', async () => {
    const onBlur = rs.fn();
    renderKit(
      <>
        <SelectField
          id="nat"
          label="Nationality"
          placeholder="Pick"
          options={options}
          value=""
          onChange={() => {}}
          onBlur={onBlur}
        />
        <button type="button">Next</button>
      </>,
    );
    const trigger = screen.getByLabelText('Nationality');
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('option', { name: 'Egypt' }));
    expect(trigger).toHaveFocus();
    expect(onBlur).not.toHaveBeenCalled();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
  it('renders its list inside the UiProvider root', async () => {
    renderKit(
      <SelectField
        id="nat"
        label="Nationality"
        placeholder="Pick"
        options={options}
        value=""
        onChange={() => {}}
      />,
      { direction: 'rtl' },
    );
    await userEvent.click(screen.getByLabelText('Nationality'));
    expect(screen.getByTestId('ui-root')).toContainElement(await screen.findByRole('listbox'));
  });
});
