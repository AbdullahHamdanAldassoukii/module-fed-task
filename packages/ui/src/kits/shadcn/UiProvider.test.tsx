import { describe, expect, it } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { UiProvider } from './UiProvider';

describe('shadcn UiProvider', () => {
  it('renders popups inside its root, so scoped styles, dir and theme reach them', () => {
    render(
      <UiProvider locale="ar" direction="rtl" colorScheme="dark">
        <Popover open>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Inside</PopoverContent>
        </Popover>
      </UiProvider>,
    );
    expect(screen.getByTestId('ui-root')).toContainElement(screen.getByText('Inside'));
  });
});
