import { describe, expect, it } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Direction } from '../../../../api';
import { UiProvider } from '../../UiProvider';
import { Calendar } from './calendar';

const day = (n: number) => screen.getByRole('button', { name: new RegExp(`January ${n}th, 2024`) });

async function pressArrowLeftFromThe15th(direction: Direction, dir?: Direction) {
  const user = userEvent.setup();
  render(
    <UiProvider locale="en" direction={direction} colorScheme="light">
      <Calendar
        mode="single"
        defaultMonth={new Date(2024, 0)}
        selected={new Date(2024, 0, 15)}
        dir={dir}
      />
    </UiProvider>,
  );
  await user.click(day(15));
  await user.keyboard('{ArrowLeft}');
}

describe('shadcn Calendar keyboard', () => {
  it('moves ArrowLeft to the previous day in LTR', async () => {
    await pressArrowLeftFromThe15th('ltr');
    expect(day(14)).toHaveFocus();
  });

  it('moves ArrowLeft to the next day in RTL, where the next day sits on the left', async () => {
    await pressArrowLeftFromThe15th('rtl');
    expect(day(16)).toHaveFocus();
  });

  it('lets an explicit dir win over the UiProvider direction', async () => {
    await pressArrowLeftFromThe15th('rtl', 'ltr');
    expect(day(14)).toHaveFocus();
  });
});
