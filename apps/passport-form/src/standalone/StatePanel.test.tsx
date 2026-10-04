import { describe, expect, it } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@repo/i18n';
import type { PassportFormState } from '@repo/passport-contract';
import { createAppI18n } from '../lib/i18n';
import { StatePanel } from './StatePanel';

const newestBase64 = '0123456789abcdefghijklmnopQRST';
const history: PassportFormState[] = [
  {
    valid: false,
    data: {
      passportNumber: 'OLDER',
      firstName: 'Ada',
      lastName: 'Lovelace',
      issueDate: '2020-01-01',
      expiryDate: '2030-01-01',
      document: null,
    },
  },
  {
    valid: true,
    data: {
      passportNumber: 'NEWEST',
      firstName: 'Grace',
      lastName: 'Hopper',
      issueDate: '2021-01-01',
      expiryDate: '2031-01-01',
      document: {
        fileName: 'passport.pdf',
        mimeType: 'application/pdf',
        base64: newestBase64,
      },
    },
  },
];

describe('StatePanel', () => {
  it('lists every report newest first and truncates document base64', () => {
    render(
      <I18nProvider i18n={createAppI18n('en')}>
        <StatePanel history={history} />
      </I18nProvider>,
    );

    const states = screen.getAllByTestId('reported-state');
    expect(states).toHaveLength(2);
    expect(states[0]).toHaveTextContent('NEWEST');
    expect(states[1]).toHaveTextContent('OLDER');
    expect(states[0]).toHaveTextContent('0123456789abcdef… (30 chars)');
    expect(states[0]).not.toHaveTextContent(newestBase64);
    expect(screen.getByTestId('reported-count')).toHaveTextContent('2 reports');
  });

  it('localizes the report count', () => {
    render(
      <I18nProvider i18n={createAppI18n('ar')}>
        <StatePanel history={history.slice(0, 1)} />
      </I18nProvider>,
    );

    expect(screen.getByTestId('reported-count')).toHaveTextContent('1 تقارير');
  });
});
