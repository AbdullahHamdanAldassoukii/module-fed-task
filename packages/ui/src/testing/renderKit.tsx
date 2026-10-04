import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { UiProvider } from '#kit';
import type { ColorScheme, Direction } from '../api';

export function renderKit(
  ui: ReactElement,
  opts: { direction?: Direction; colorScheme?: ColorScheme; locale?: string } & RenderOptions = {},
) {
  const { direction = 'ltr', colorScheme = 'light', locale = 'en', ...rest } = opts;
  return render(
    <UiProvider locale={locale} direction={direction} colorScheme={colorScheme}>
      {ui}
    </UiProvider>,
    rest,
  );
}
