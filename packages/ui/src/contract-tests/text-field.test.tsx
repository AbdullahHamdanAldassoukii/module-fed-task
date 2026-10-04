import { describe, expect, it, rs } from '@rstest/core';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextField } from '../testing/kit';
import { renderKit } from '../testing/renderKit';

describe('TextField', () => {
  it('links label, description and error to the input', () => {
    renderKit(
      <TextField
        id="first"
        label="First name"
        description="As in passport"
        error="Required"
        required
        value=""
        onChange={() => {}}
      />,
    );
    const input = screen.getByLabelText(/First name/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    const described = (input.getAttribute('aria-describedby') ?? '').split(' ');
    expect(described).toContain('first-description');
    expect(described).toContain('first-error');
    expect(screen.getByText('Required')).toHaveAttribute('id', 'first-error');
    expect(screen.getByText('As in passport')).toHaveAttribute('id', 'first-description');
  });
  it('is valid without an error and calls onChange per keystroke', async () => {
    const onChange = rs.fn();
    renderKit(<TextField id="n" label="Number" value="" onChange={onChange} />);
    const input = screen.getByLabelText('Number');
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(input, 'A1');
    expect(onChange).toHaveBeenNthCalledWith(1, 'A');
    expect(onChange).toHaveBeenNthCalledWith(2, '1');
  });
  it('forwards inputRef', () => {
    const ref = { current: null as HTMLInputElement | null };
    renderKit(<TextField id="r" label="R" value="" onChange={() => {}} inputRef={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
