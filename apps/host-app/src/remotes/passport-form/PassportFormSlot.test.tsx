import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, useEffect, useState, type ComponentProps, type ReactElement } from 'react';
import {
  EMPTY_PASSPORT_DRAFT,
  type PassportDraft,
  type PassportFormModule,
  type PassportFormProps,
  type PassportFormState,
} from '@repo/passport-contract';
import { RemoteLoadError } from '../../lib/errors';
import { noopLogger, type Logger } from '../../lib/logger';
import { fakeModule } from '../../testing/fakeRemotes';
import { renderWithProviders } from '../../testing/renderWithProviders';
import { AppHeader } from '../../components/AppHeader';
import { devScenarios } from '../../app/devScenarios';
import { DevPanel } from '../../app/devPanel/DevPanel';
import { devPanel } from '../../app/devPanel/devPanelStore';
import { getRemoteScenario } from './devScenarios';
import { createPassportFormLoader } from './loader';
import { PassportFormSlot } from './PassportFormSlot';

const manifestUrl = 'http://localhost:3001/mf-manifest.json';
const consoleErrorSpies: { mockRestore: () => void }[] = [];

afterEach(() => {
  consoleErrorSpies.splice(0).forEach((spy) => spy.mockRestore());
  rs.useRealTimers();
  devPanel.close();
  devScenarios.reset();
});

function silenceExpectedConsoleError() {
  const spy = rs.spyOn(console, 'error').mockImplementation(() => undefined);
  consoleErrorSpies.push(spy);
  return spy;
}

function StatefulHarness({
  onChange = () => undefined,
  ...props
}: Omit<ComponentProps<typeof PassportFormSlot>, 'value' | 'onChange'> & {
  onChange?: (state: PassportFormState) => void;
}) {
  const [value, setValue] = useState<PassportDraft>({ ...EMPTY_PASSPORT_DRAFT, firstName: 'Ali' });

  return (
    <PassportFormSlot
      {...props}
      value={value}
      onChange={(state) => {
        setValue(state.data);
        onChange(state);
      }}
    />
  );
}

function ChangingDocumentRemote({ onChange }: PassportFormProps) {
  useEffect(() => {
    const data = {
      ...EMPTY_PASSPORT_DRAFT,
      document: {
        fileName: 'passport.pdf',
        mimeType: 'application/pdf' as const,
        base64: 'A',
      },
    };

    onChange({ valid: false, data });
    onChange({
      valid: false,
      data: { ...data, document: { ...data.document, base64: 'B' } },
    });
  }, [onChange]);

  return <div data-testid="changing-document-remote" />;
}

const changingDocumentModule: PassportFormModule = {
  contractVersion: '1.0.0',
  default: ChangingDocumentRemote,
};

function renderSlot(
  importModule: () => Promise<unknown>,
  onChange: (state: PassportFormState) => void = () => undefined,
  {
    logger = noopLogger,
    providerLocale = 'ar',
    reregister = rs.fn(),
    strict = false,
    withDevPanel = false,
  }: {
    logger?: Logger;
    providerLocale?: 'en' | 'ar';
    reregister?: (url: string) => void;
    strict?: boolean;
    withDevPanel?: boolean;
  } = {},
) {
  const loader = createPassportFormLoader({
    manifestUrl,
    logger,
    importModule,
    reregister,
  });
  const slot = <StatefulHarness colorScheme="dark" locale="ar" onChange={onChange} />;
  const wrappedSlot = strict ? <StrictMode>{slot}</StrictMode> : slot;
  const ui: ReactElement = withDevPanel ? (
    <>
      <AppHeader onOpenDevPanel={devPanel.open} />
      {wrappedSlot}
      <DevPanel />
    </>
  ) : (
    wrappedSlot
  );

  return {
    ...renderWithProviders(ui, {
      locale: providerLocale,
      services: { logger, remotes: { passportForm: loader } },
    }),
    reregister,
  };
}

describe('PassportFormSlot', () => {
  it('loads the remote, maps props, and forwards valid state', async () => {
    const onChange = rs.fn();
    renderSlot(async () => fakeModule(), onChange);

    const remote = await screen.findByTestId('fake-remote');
    expect(remote).toHaveAttribute('data-locale', 'ar');
    expect(remote).toHaveAttribute('data-scheme', 'dark');
    expect(screen.getByLabelText('First name')).toHaveValue('Ali');
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({
      valid: false,
      data: { firstName: 'Ali' },
    });
  });

  it('does not forward an unchanged state again after the parent updates', async () => {
    const onChange = rs.fn();
    renderSlot(async () => fakeModule(), onChange);

    await screen.findByTestId('fake-remote');
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('does not re-report an unchanged state in StrictMode', async () => {
    const onChange = rs.fn();
    renderSlot(async () => fakeModule(), onChange, { strict: true });

    await screen.findByTestId('fake-remote');
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('forwards a same-name document when its base64 content changes', async () => {
    const states: PassportFormState[] = [];
    renderSlot(
      async () => changingDocumentModule,
      (state) => states.push(state),
    );

    await screen.findByTestId('changing-document-remote');
    await waitFor(() => expect(states).toHaveLength(2));
    expect(states[1]?.data.document?.base64).toBe('B');
  });

  it('shows a labelled skeleton while loading and still loading after three seconds', async () => {
    rs.useFakeTimers();
    renderSlot(() => new Promise(() => undefined));

    expect(
      screen.getByRole('status', { name: 'جارٍ تحميل نموذج جواز السفر…' }),
    ).toBeInTheDocument();
    await act(async () => {
      await rs.advanceTimersByTimeAsync(3_000);
    });
    expect(screen.getByText('لا يزال التحميل جاريًا…')).toBeInTheDocument();
  });

  it('shows the unavailable fallback after a remote hangs for fifteen seconds and recovers on retry', async () => {
    const consoleError = silenceExpectedConsoleError();
    rs.useFakeTimers();
    let attempts = 0;
    const reregister = rs.fn();
    renderSlot(
      async () => {
        attempts += 1;
        if (attempts === 1) return new Promise(() => undefined);
        return fakeModule();
      },
      undefined,
      { reregister },
    );

    await act(async () => {
      await rs.advanceTimersByTimeAsync(15_000);
    });

    expect(screen.getByRole('alert')).toHaveTextContent('تعذر تحميل نموذج جواز السفر');
    rs.useRealTimers();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'حاول مرة أخرى' }));
    expect(await screen.findByTestId('fake-remote')).toBeInTheDocument();
    expect(reregister).toHaveBeenCalledWith(manifestUrl);
    expect(consoleError.mock.calls.flat()).toContainEqual(
      expect.objectContaining({ name: 'RemoteLoadError', reason: 'timeout' }),
    );
  });

  it('load failure shows the fallback and Try again reloads it', async () => {
    const consoleError = silenceExpectedConsoleError();
    let attempts = 0;
    const user = userEvent.setup();
    const reregister = rs.fn();
    const events: string[] = [];
    const logger: Logger = {
      ...noopLogger,
      error: (event) => {
        events.push(event);
      },
    };
    renderSlot(
      async () => {
        attempts += 1;
        if (attempts === 1) throw new RemoteLoadError('load-failed');
        return fakeModule();
      },
      undefined,
      { logger, reregister },
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('تعذر تحميل نموذج جواز السفر');
    await user.click(screen.getByRole('button', { name: 'حاول مرة أخرى' }));
    expect(await screen.findByTestId('fake-remote')).toBeInTheDocument();
    expect(attempts).toBe(2);
    expect(reregister).toHaveBeenCalledWith(manifestUrl);
    expect(events).toEqual(['remote.load_failed']);
    expect(consoleError.mock.calls.flat()).toContainEqual(
      expect.objectContaining({ name: 'RemoteLoadError', reason: 'load-failed' }),
    );
  });

  it('treats an incompatible module version as unavailable without a duplicate render log', async () => {
    const consoleError = silenceExpectedConsoleError();
    const events: string[] = [];
    const logger: Logger = {
      ...noopLogger,
      error: (event) => {
        events.push(event);
      },
    };
    renderSlot(async () => ({ ...fakeModule(), contractVersion: '2.0.0' }), undefined, {
      logger,
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'نموذج جواز السفر غير متوافق مع هذا الإصدار من التطبيق.',
    );
    expect(events).toEqual(['remote.contract_mismatch']);
    expect(consoleError.mock.calls.flat()).toContainEqual(
      expect.objectContaining({ name: 'RemoteContractError' }),
    );
  });

  it('forwards malformed onChange payloads as invalid with the last draft', async () => {
    const onChange = rs.fn();
    renderSlot(async () => fakeModule(() => ({ valid: true, data: { broken: true } })), onChange);

    await screen.findByTestId('fake-remote');
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual({
      valid: false,
      data: { ...EMPTY_PASSPORT_DRAFT, firstName: 'Ali' },
    });
  });

  it('isolates a remote crash and Try again remounts with the latest draft', async () => {
    const consoleError = silenceExpectedConsoleError();
    const user = userEvent.setup();
    const reregister = rs.fn();
    renderSlot(async () => fakeModule(), undefined, { reregister });

    await screen.findByTestId('fake-remote');
    await user.type(screen.getByLabelText('First name'), 'ce');
    await user.click(screen.getByRole('button', { name: 'Crash' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'حاول مرة أخرى' }));
    expect(await screen.findByLabelText('First name')).toHaveValue('Alice');
    expect(reregister).not.toHaveBeenCalled();
    expect(consoleError.mock.calls.flat()).toContainEqual(
      expect.objectContaining({ message: 'remote crashed' }),
    );
  });

  it('reloads a loaded form for Down and recovers as soon as Normal is chosen', async () => {
    const consoleError = silenceExpectedConsoleError();
    const user = userEvent.setup();
    renderSlot(
      async () => {
        if (getRemoteScenario() === 'down') throw new Error('remote is down');
        return fakeModule();
      },
      undefined,
      { providerLocale: 'en', withDevPanel: true },
    );

    await screen.findByTestId('fake-remote');
    await user.click(screen.getByRole('button', { name: 'DEV Developer panel' }));
    await user.click(screen.getByRole('radio', { name: 'Down' }));
    expect(await screen.findByRole('alert')).toHaveTextContent("The passport form couldn't load");

    await user.click(screen.getByRole('radio', { name: 'Normal' }));
    expect(await screen.findByTestId('fake-remote')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(consoleError.mock.calls.flat()).toContainEqual(
      expect.objectContaining({ name: 'RemoteLoadError', reason: 'load-failed' }),
    );
  });
});
