import { describe, expect, it } from '@rstest/core';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../testing/renderWithProviders';
import { WizardStepper } from './WizardStepper';

describe('WizardStepper', () => {
  it('uses translated status words in Arabic', () => {
    renderWithProviders(<WizardStepper currentId="passport" />, { locale: 'ar' });

    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent(
      /جواز السفر.*الحالية/,
    );
  });
});
