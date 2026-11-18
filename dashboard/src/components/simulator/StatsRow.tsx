import type { RunResult } from '../../lib/engine';
import { formatRate } from '../../lib/format';

interface StatsRowProps {
  run: RunResult | null;
  repetitions: number;
  seed: number;
}

export function StatsRow({ run, repetitions, seed }: StatsRowProps) {
  const items: Array<[string, string]> = [
    ['Trials', String(run?.repetitions ?? repetitions)],
    ['Failures', run ? String(run.failureCount) : '—'],
    ['Observed rate', run ? formatRate(run.failureRate) : '—'],
    ['95% low', run ? run.wilson95[0].toFixed(4) : '—'],
    ['95% high', run ? run.wilson95[1].toFixed(4) : '—'],
    ['Seed', String(run?.seed ?? seed)],
  ];
  return (
    <div className="stats">
      {items.map(([label, value]) => (
        <div className="stat" key={label}>
          <b>{value}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
