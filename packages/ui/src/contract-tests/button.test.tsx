import { describe, expect, it, rs } from '@rstest/core';
import { screen } from '@testing-library/react';
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';
import { Button } from '../testing/kit';
import { renderKit } from '../testing/renderKit';

describe('Button', () => {
  it('renders an accessible button and calls onClick', async () => {
    const onClick = rs.fn();
    renderKit(<Button onClick={onClick}>Next</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('is type=button by default (never submits a form by accident)', () => {
    renderKit(<Button>Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
  it('disabled and loading states block clicks and expose aria-busy', async () => {
    // A disabled button ignores the pointer (pointer-events: none in both kits' styles; only MUI's
    // are loaded here). The click is tried anyway and must not land.
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    const onClick = rs.fn();
    const { rerender } = renderKit(
      <Button disabled onClick={onClick}>
        Submit
      </Button>,
    );
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
    rerender(
      <Button loading onClick={onClick}>
        Submit
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });
  it('exposes a ref via buttonRef', () => {
    const ref = { current: null as HTMLButtonElement | null };
    renderKit(<Button buttonRef={ref}>Focus me</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
