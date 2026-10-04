import { afterEach, describe, expect, it } from '@rstest/core';
import { screen } from '@testing-library/react';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  document.body.innerHTML = '';
});

describe('bootstrap', () => {
  it.each([
    ['404 response', () => new Response('', { status: 404 })],
    ['HTML response', () => new Response('<!doctype html>', { status: 200 })],
    ['invalid JSON response', () => new Response(JSON.stringify({ env: 'development' }))],
  ])('renders the plain configuration error page for a %s', async (_caseName, response) => {
    document.body.innerHTML = '<div id="root"></div>';
    globalThis.fetch = async () => response();

    const { bootstrap } = await import('./bootstrap');
    await bootstrap();

    expect(screen.getByRole('alert')).toHaveTextContent('Configuration error');
    expect(document.querySelector('#root > main')).not.toBeNull();
  });
});
