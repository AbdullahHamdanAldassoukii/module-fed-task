export function renderConfigErrorPage(container: HTMLElement, error: unknown): void {
  const detail = error instanceof Error ? error.message : String(error);
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
  container.innerHTML = '';

  const main = document.createElement('main');
  main.setAttribute('role', 'alert');
  main.style.cssText =
    'font-family:system-ui,sans-serif;padding:24px;max-width:560px;margin:10vh auto';

  const heading = document.createElement('h1');
  heading.textContent = 'Configuration error';
  heading.style.fontSize = '20px';

  const body = document.createElement('p');
  body.textContent =
    'The application could not start because its configuration is missing or invalid.';

  const details = document.createElement('pre');
  details.textContent = detail;
  details.style.cssText = 'white-space:pre-wrap;font-size:12px;opacity:.8';

  main.append(heading, body, details);
  container.append(main);
}
