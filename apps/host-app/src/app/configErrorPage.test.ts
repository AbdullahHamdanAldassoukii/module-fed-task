import { describe, expect, it } from '@rstest/core';
import { ConfigError } from '../lib/errors';
import { renderConfigErrorPage } from './configErrorPage';

describe('renderConfigErrorPage', () => {
  it('renders an alert with configuration detail without React or the UI kit', () => {
    const container = document.createElement('div');

    renderConfigErrorPage(
      container,
      new ConfigError('Invalid /config.json: api.baseUrl: Required'),
    );

    expect(container.querySelector('[role="alert"]')).toHaveTextContent('Configuration error');
    expect(container).toHaveTextContent('api.baseUrl');
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
  });

  it.each([
    'HTTP 404',
    'Unexpected token < in JSON',
    'Invalid /config.json: api.baseUrl: Required',
  ])('renders a plain configuration error for %s', (message) => {
    const container = document.createElement('div');

    renderConfigErrorPage(container, new Error(message));

    expect(container.querySelector('[role="alert"]')).toHaveTextContent('Configuration error');
    expect(container).toHaveTextContent(message);
  });
});
