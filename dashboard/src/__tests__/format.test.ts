/**
 * WHAT YOU WILL LEARN
 * - Formatting is a tiny, testable boundary between the engine and the UI.
 * - Why rates and intervals get their own helpers instead of inline strings.
 */
import { describe, expect, it } from 'vitest';
import {
  BUILD_LABEL,
  FAULT_LABEL,
  VERDICT_LABEL,
  VERDICT_TONE,
  formatCount,
  formatInterval,
  formatPercent,
  formatRate,
  formatTimestamp,
  formatTrials,
} from '../lib/format';

describe('format helpers', () => {
  it('pluralises counts', () => {
    expect(formatCount(1, 'trial')).toBe('1 trial');
    expect(formatCount(2, 'trial')).toBe('2 trials');
    expect(formatCount(0, 'event')).toBe('0 events');
  });

  it('renders percentages and rates', () => {
    expect(formatPercent(0.375)).toBe('38%');
    expect(formatPercent(1)).toBe('100%');
    expect(formatRate(0.95)).toBe('0.95');
    expect(formatRate(0)).toBe('0.00');
  });

  it('renders a four-decimal interval', () => {
    expect(formatInterval([0.7639, 0.9911])).toBe('0.7639–0.9911');
    expect(formatInterval([0, 0])).toBe('0.0000–0.0000');
  });

  it('turns trials into a bit string', () => {
    expect(formatTrials([true, false, true])).toBe('101');
    expect(formatTrials([])).toBe('');
  });

  it('turns a normalized timestamp into a UTC label', () => {
    expect(formatTimestamp('2026-05-12T10:00:03+00:00')).toBe('2026-05-12 10:00:03 UTC');
    expect(formatTimestamp('2026-05-12T10:00:03Z')).toBe('2026-05-12 10:00:03 UTC');
  });

  it('labels faults, builds and verdicts', () => {
    expect(FAULT_LABEL.route_blackhole).toBe('route blackhole');
    expect(BUILD_LABEL.buggy).toBe('pre-fix build');
    expect(VERDICT_LABEL.REGRESSION_GUARDED).toBe('Regression guarded');
    expect(VERDICT_TONE.REPRODUCED).toBe('no');
    expect(VERDICT_TONE.INCONCLUSIVE).toBe('mu');
    expect(VERDICT_TONE.REGRESSION_GUARDED).toBe('ok');
  });
});
