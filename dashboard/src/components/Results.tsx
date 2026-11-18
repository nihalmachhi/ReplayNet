import type { CSSProperties } from 'react';
import { FAULTS, scenarioFor } from '../data/fixtures';
import { HEADINGS, RESULTS_LEAD, RESULTS_NOTE } from '../data/content';
import { runScenario, type RunResult } from '../lib/engine';
import { FAULT_LABEL } from '../lib/format';
import { Icon } from './Icon';

interface Row {
  label: string;
  percent: number;
  display: string;
  color: string;
}

const REPS = 20;
const SEED = 7;

function BarRow({ row }: { row: Row }) {
  return (
    <div className="mr">
      <span>{row.label}</span>
      <div className="track">
        <div
          className="grow"
          style={
            {
              '--w': `${row.percent}%`,
              '--c': row.color,
              animation: 'none',
              width: `${row.percent}%`,
            } as CSSProperties
          }
        />
      </div>
      <b>{row.display}</b>
    </div>
  );
}

function intervalRows(run: RunResult, color: string): Row[] {
  return [
    {
      label: 'Observed',
      percent: run.failureRate * 100,
      display: `${run.failureCount}/${run.repetitions}`,
      color,
    },
    {
      label: 'Low',
      percent: run.wilson95[0] * 100,
      display: run.wilson95[0].toFixed(4),
      color,
    },
    {
      label: 'High',
      percent: run.wilson95[1] * 100,
      display: run.wilson95[1].toFixed(4),
      color,
    },
  ];
}

export function Results() {
  const buggy = runScenario(scenarioFor('route_blackhole', 'buggy'), REPS, SEED);
  const fixed = runScenario(scenarioFor('route_blackhole', 'fixed'), REPS, SEED);
  const heading = HEADINGS.results;

  const cards: Array<{ title: string; description: string; rows: Row[] }> = [
    {
      title: 'Reproduced',
      description: `${buggy.failureCount} of ${buggy.repetitions} trials failed at seed ${buggy.seed}.`,
      rows: intervalRows(buggy, 'var(--bad)'),
    },
    {
      title: 'Regression guarded',
      description: `${fixed.failureCount} of ${fixed.repetitions} trials failed after the fix.`,
      rows: intervalRows(fixed, 'var(--ok)'),
    },
    {
      title: 'Where the signal is',
      description: 'Pre-fix failure rate per fault at the same seed and trial count.',
      rows: FAULTS.map((fault) => {
        const run = runScenario(scenarioFor(fault, 'buggy'), REPS, SEED);
        return {
          label: FAULT_LABEL[fault].split(' ')[0],
          percent: run.failureRate * 100,
          display: `${run.failureCount}/${run.repetitions}`,
          color: '#a78bfa',
        };
      }),
    },
  ];

  return (
    <section className="sec" id="results">
      <h2>
        {heading.lead}{' '}
        <span className="m">
          <i className="ico" style={{ '--c': heading.color } as CSSProperties}>
            <Icon name={heading.icon} />
          </i>{' '}
          {heading.trail}
        </span>
      </h2>
      <p className="lead2">{RESULTS_LEAD}</p>
      <div className="rg">
        {cards.map((card) => (
          <div className="rc" key={card.title}>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <div className="tb">
              {card.rows.map((row) => (
                <BarRow row={row} key={row.label} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="note">{RESULTS_NOTE}</p>
    </section>
  );
}
