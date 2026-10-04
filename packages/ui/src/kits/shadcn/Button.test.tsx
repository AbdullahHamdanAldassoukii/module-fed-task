import { describe, expect, it } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('shadcn Button', () => {
  it('draws the destructive variant solid, with the foreground colour made for it', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground');
    expect(button).not.toHaveClass('text-destructive');
  });
});
