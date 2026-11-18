/**
 * WHAT YOU WILL LEARN
 * - How a reducer keeps the lab controls predictable.
 * - How the UI derives its verdict chip from the same engine the tests use.
 * - How a seeded run is reproducible without hard-coding a result in JSX.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Simulator } from '../components/Simulator';

describe('simulator', () => {
  it('starts with no run and an empty trial strip', () => {
    render(<Simulator />);
    expect(screen.getByText('no run yet')).toBeInTheDocument();
    expect(screen.getByText('Run the scenario to see each trial.')).toBeInTheDocument();
    expect(
      screen.getByText('Run a scenario, then pick an event to see its normalized fields.'),
    ).toBeInTheDocument();
    expect(screen.getByText('20', { selector: '.stat b' })).toBeInTheDocument();
  });

  it('replays the default route scenario and shows 19 of 20 failures', async () => {
    const user = userEvent.setup();
    render(<Simulator />);
    await user.click(screen.getByRole('button', { name: 'Replay scenario' }));

    expect(screen.getByText('Reproduced · 19/20 failed')).toBeInTheDocument();
    expect(screen.getByText('19', { selector: '.stat b' })).toBeInTheDocument();
    expect(screen.getByText('0.95', { selector: '.stat b' })).toBeInTheDocument();
    expect(
      screen.getByText('19 of 20 trials reproduced the fault · seed 7'),
    ).toBeInTheDocument();
    expect(screen.getByText('Synthetic route next hop changed for [REDACTED_IP]/24')).toBeInTheDocument();
    expect(screen.getByText('Route change coincides with packet loss')).toBeInTheDocument();
  });

  it('selects an event and keeps aria-pressed on exactly one row', async () => {
    const user = userEvent.setup();
    render(<Simulator />);
    await user.click(screen.getByRole('button', { name: 'Replay scenario' }));
    await user.click(screen.getByRole('button', { name: /evt-3/ }));

    expect(
      screen.getByText('Synthetic prior next hop restored; token=[REDACTED]'),
    ).toBeInTheDocument();
    const pressed = screen
      .getAllByRole('button')
      .filter((button) => button.getAttribute('aria-pressed') === 'true');
    expect(pressed).toHaveLength(1);
    expect(pressed[0]?.textContent).toContain('evt-3');
  });

  it('replays the fixed build as regression guarded with no failures', async () => {
    const user = userEvent.setup();
    render(<Simulator />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Build' }), 'fixed');
    await user.click(screen.getByRole('button', { name: 'Replay scenario' }));

    expect(screen.getByText('Regression guarded · 0/20 failed')).toBeInTheDocument();
    expect(screen.getByText('0 of 20 trials reproduced the fault · seed 7')).toBeInTheDocument();
    const trials = document.querySelectorAll('.trial');
    expect(trials).toHaveLength(20);
    expect(Array.from(trials).every((trial) => trial.classList.contains('ok'))).toBe(true);
  });

  it('switches to the MTU bundle and its hypothesis', async () => {
    const user = userEvent.setup();
    render(<Simulator />);
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Fault' }),
      'mtu_blackhole',
    );
    await user.click(screen.getByRole('button', { name: 'Replay scenario' }));

    expect(screen.getByText('Path MTU signal coincides with retransmission')).toBeInTheDocument();
    expect(screen.getByText('2 normalized events · mtu-change.jsonl')).toBeInTheDocument();
    expect(screen.getByText('Reproduced · 18/20 failed')).toBeInTheDocument();
  });

  it('clamps the trial count and seed to the backend limits', async () => {
    render(<Simulator />);
    const trials = screen.getByRole('slider', { name: 'Trials' });
    fireEvent.change(trials, { target: { value: '1' } });
    expect(screen.getByText('5', { selector: '.stat b' })).toBeInTheDocument();

    const seed = screen.getByRole('spinbutton', { name: 'Seed' });
    fireEvent.change(seed, { target: { value: '-4' } });
    expect(seed).toHaveValue(0);

    fireEvent.change(seed, { target: { value: '9999999999' } });
    expect(seed).toHaveValue(2147483647);
  });

  it('runs ten trials at seed 11 and reports nine failures', async () => {
    const user = userEvent.setup();
    render(<Simulator />);
    fireEvent.change(screen.getByRole('slider', { name: 'Trials' }), { target: { value: '10' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Seed' }), { target: { value: '11' } });
    await user.click(screen.getByRole('button', { name: 'Replay scenario' }));

    expect(screen.getByText('Reproduced · 9/10 failed')).toBeInTheDocument();
    expect(screen.getByText('9 of 10 trials reproduced the fault · seed 11')).toBeInTheDocument();
  });

  it('clears a stale run when the scenario changes and resets cleanly', async () => {
    const user = userEvent.setup();
    render(<Simulator />);
    await user.click(screen.getByRole('button', { name: 'Replay scenario' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Build' }), 'fixed');
    expect(screen.getByText('no run yet')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Replay scenario' }));
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByText('no run yet')).toBeInTheDocument();
    expect(screen.getByText('Run the scenario to see each trial.')).toBeInTheDocument();
  });

  it('shows all six scenarios in the comparison table', () => {
    render(<Simulator />);
    const table = document.querySelector('#cmp');
    expect(table).not.toBeNull();
    const content = within(table as HTMLElement);
    expect(content.getByText('route blackhole')).toBeInTheDocument();
    expect(content.getByText('MTU blackhole')).toBeInTheDocument();
    expect(content.getByText('loss during failover')).toBeInTheDocument();
    expect(content.getAllByText('Reproduced')).toHaveLength(3);
    expect(content.getAllByText('Regression guarded')).toHaveLength(3);
  });
});
