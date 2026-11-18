import type { Build, Fault, Verdict } from './engine';

export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** Failure rates are stored rounded to four decimals, like the backend. */
export function formatRate(value: number): string {
  return value.toFixed(2);
}

export function formatInterval([low, high]: [number, number]): string {
  return `${low.toFixed(4)}–${high.toFixed(4)}`;
}

export function formatTrials(trials: boolean[]): string {
  return trials.map((failed) => (failed ? '1' : '0')).join('');
}

export const FAULT_LABEL: Record<Fault, string> = {
  route_blackhole: 'route blackhole',
  mtu_blackhole: 'MTU blackhole',
  loss_during_failover: 'loss during failover',
};

export const BUILD_LABEL: Record<Build, string> = {
  buggy: 'pre-fix build',
  fixed: 'fixed build',
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  REPRODUCED: 'Reproduced',
  INCONCLUSIVE: 'Inconclusive',
  REGRESSION_GUARDED: 'Regression guarded',
};

export const VERDICT_TONE: Record<Verdict, 'no' | 'mu' | 'ok'> = {
  REPRODUCED: 'no',
  INCONCLUSIVE: 'mu',
  REGRESSION_GUARDED: 'ok',
};

/** Turns a normalized `+00:00` timestamp into a compact UTC label. */
export function formatTimestamp(timestamp: string): string {
  return timestamp.replace('T', ' ').replace('+00:00', ' UTC').replace('Z', ' UTC');
}
