import { describe, expect, it } from '@rstest/core';
import { act, render, screen } from '@testing-library/react';
import { Toaster, toast } from './Toaster';
import { UiProvider } from './UiProvider';

describe('shadcn Toaster', () => {
  it('takes theme and direction from UiProvider and maps the tone', async () => {
    render(
      <UiProvider locale="ar" direction="rtl" colorScheme="dark">
        <Toaster />
      </UiProvider>,
    );
    act(() => {
      toast('Upload failed', { tone: 'error', description: 'Try again later' });
    });
    const item = (await screen.findByText('Upload failed')).closest('[data-sonner-toast]');
    expect(item).toHaveAttribute('data-type', 'error');
    expect(screen.getByText('Try again later')).toBeInTheDocument();
    const toaster = item?.closest('[data-sonner-toaster]');
    expect(toaster).toHaveAttribute('data-sonner-theme', 'dark');
    expect(toaster).toHaveAttribute('dir', 'rtl');
  });
});
