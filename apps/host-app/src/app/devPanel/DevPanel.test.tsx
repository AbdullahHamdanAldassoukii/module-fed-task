import { afterEach, describe, expect, it } from '@rstest/core';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppHeader } from '../../components/AppHeader';
import { renderWithProviders } from '../../testing/renderWithProviders';
import { devScenarios, getExtraRequestHeaders } from '../devScenarios';
import { DevPanel } from './DevPanel';
import { devPanel } from './devPanelStore';

afterEach(() => {
  devPanel.close();
  devScenarios.reset();
});

describe('DevPanel', () => {
  it('opens from the environment badge, selects an API scenario, and resets it', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <AppHeader onOpenDevPanel={devPanel.open} />
        <DevPanel />
      </>,
    );

    const badge = screen.getByRole('button', { name: 'DEV Developer panel' });
    expect(badge).toHaveAttribute('aria-haspopup', 'dialog');
    expect(badge).toHaveAttribute('aria-expanded', 'false');
    await user.click(badge);
    await screen.findByRole('dialog', { name: 'Developer panel' });
    expect(screen.getByRole('button', { name: 'Close developer panel' })).toHaveFocus();
    await user.click(await screen.findByRole('radio', { name: 'Server error (500)' }));

    expect(devScenarios.getApiScenario()).toBe('server-error');
    expect(getExtraRequestHeaders()).toEqual({ 'x-mock-scenario': 'server-error' });

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(getExtraRequestHeaders()).toEqual({});
  });

  it('selects a remote scenario and explains how recovery works', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <AppHeader onOpenDevPanel={devPanel.open} />
        <DevPanel />
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'DEV Developer panel' }));

    await user.click(await screen.findByRole('radio', { name: 'Contract mismatch' }));

    expect(devScenarios.getRemoteScenario()).toBe('mismatch');
    expect(
      screen.getByText(
        'Changing a remote scenario reloads the form. If it fails, choose Normal and Try again.',
      ),
    ).toBeInTheDocument();
  });

  it('closes on Escape and restores focus to the environment badge', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <AppHeader onOpenDevPanel={devPanel.open} />
        <DevPanel />
      </>,
    );
    const badge = screen.getByRole('button', { name: 'DEV Developer panel' });

    await user.click(badge);
    expect(await screen.findByRole('button', { name: 'Close developer panel' })).toHaveFocus();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(badge).toHaveFocus();
  });
});
