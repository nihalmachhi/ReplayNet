/**
 * WHAT YOU WILL LEARN
 * - How a Python backend's measurement and redaction rules become pure TS.
 * - Why the browser engine implements CPython's MT19937 instead of Math.random.
 * - Where the engine deliberately mirrors a backend quirk or limitation.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FAILURE_RATES,
  HYPOTHESIS_METHOD,
  MAX_BUNDLE_EVENTS,
  MAX_REPETITIONS,
  PythonRandom,
  hypothesesFor,
  ingest,
  minimize,
  normalizeEvent,
  redact,
  redactText,
  runScenario,
  sha256Hex,
  simulate,
  verdictFor,
  wilsonInterval,
} from '../lib/engine';
import { EXPECTED_RUNS, WILSON_CASES, scenarioById } from '../data/fixtures';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Wilson interval', () => {
  it('matches every pinned Python value', () => {
    for (const item of WILSON_CASES) {
      const [low, high] = wilsonInterval(item.successes, item.trials);
      expect(low, `${item.successes}/${item.trials} low`).toBeCloseTo(item.expected[0], 4);
      expect(high, `${item.successes}/${item.trials} high`).toBeCloseTo(item.expected[1], 4);
    }
  });

  it('returns zeroes for a zero-trial run', () => {
    expect(wilsonInterval(3, 0)).toEqual([0, 0]);
  });
});

describe('CPython-compatible simulation', () => {
  it('reproduces the first random draw for seed 7', () => {
    expect(new PythonRandom(7).random()).toBeCloseTo(0.32383276483316237, 15);
  });

  it('is deterministic for the same seed and differs across seeds', () => {
    expect(simulate('route_blackhole', 'buggy', 10)).toBe(
      simulate('route_blackhole', 'buggy', 10),
    );
    const draws = new Set(
      Array.from({ length: 8 }, (_, index) =>
        new PythonRandom(index).random().toFixed(12),
      ),
    );
    expect(draws.size).toBe(8);
  });

  it('uses the documented failure rates', () => {
    expect(FAILURE_RATES.route_blackhole.buggy).toBe(0.96);
    expect(FAILURE_RATES.mtu_blackhole.fixed).toBe(0.02);
    expect(FAILURE_RATES.loss_during_failover.buggy).toBe(0.91);
  });
});

describe('runScenario', () => {
  it('matches all six expected runs bit for bit', () => {
    for (const expected of EXPECTED_RUNS) {
      const run = runScenario(
        scenarioById(expected.scenarioId),
        expected.repetitions,
        expected.seed,
      );
      expect(run.failureCount, expected.scenarioId).toBe(expected.failureCount);
      expect(run.failureRate, expected.scenarioId).toBe(expected.failureRate);
      expect(run.wilson95, expected.scenarioId).toEqual(expected.wilson95);
      expect(run.verdict, expected.scenarioId).toBe(expected.verdict);
      expect(run.trials.map((failed) => (failed ? '1' : '0')).join(''), expected.scenarioId).toBe(
        expected.trials,
      );
      expect(run.lab).toBe('deterministic-in-process-simulator');
      expect(run.specId).toBe(expected.scenarioId);
    }
  });

  it('uses seed + i for each trial', () => {
    const scenario = scenarioById('route-buggy');
    const run = runScenario(scenario, 10, 11);
    expect(run.trials).toEqual(
      Array.from({ length: 10 }, (_, index) => simulate(scenario.fault, scenario.build, 11 + index)),
    );
    expect(run.trials.map((failed) => (failed ? '1' : '0')).join('')).toBe('1111011111');
  });

  it('rounds the rate and interval to four decimals', () => {
    const run = runScenario(scenarioById('route-buggy'), 30, 11);
    expect(run.failureRate).toBe(0.9667);
    expect(run.wilson95).toEqual([0.8333, 0.9941]);
  });
});

describe('verdicts', () => {
  it('needs a low bound at 0.5 for a buggy build', () => {
    expect(verdictFor('buggy', 0.5, 0.9)).toBe('REPRODUCED');
    expect(verdictFor('buggy', 0.49, 0.9)).toBe('INCONCLUSIVE');
  });

  it('needs a high bound below 0.5 for a fixed build', () => {
    expect(verdictFor('fixed', 0, 0.49)).toBe('REGRESSION_GUARDED');
    expect(verdictFor('fixed', 0, 0.5)).toBe('INCONCLUSIVE');
  });
});

describe('redaction', () => {
  it('replaces text secrets, emails and IPv4 literals', () => {
    expect(redactText('token=abc123')).toBe('token=[REDACTED]');
    expect(redactText('password: hunter2')).toBe('password:[REDACTED]');
    expect(redactText('api_key = abc')).toBe('api_key=[REDACTED]');
    expect(redactText('mail ops@example.com now')).toBe('mail [REDACTED_EMAIL] now');
    expect(redactText('from 198.51.100.7 today')).toBe('from [REDACTED_IP] today');
    expect(redactText('no secret here')).toBe('no secret here');
  });

  it('does not touch IPv6 or hostnames', () => {
    expect(redactText('2001:db8::1')).toBe('2001:db8::1');
    expect(redactText('router.example.net')).toBe('router.example.net');
  });

  it('redacts recursively and blanks secret-looking keys', () => {
    expect(
      redact({
        token: 'keep-out',
        nested: { password: 'keep-out', list: ['ops@example.com', 7, true, null] },
        plain: '198.51.100.7',
      }),
    ).toEqual({
      token: '[REDACTED]',
      nested: { password: '[REDACTED]', list: ['[REDACTED_EMAIL]', 7, true, null] },
      plain: '[REDACTED_IP]',
    });
  });
});

describe('normalization', () => {
  it('fills defaults, truncates fields and keeps UTC', () => {
    const event = normalizeEvent(
      {
        timestamp: '2026-05-12T10:00:00.123Z',
        kind: 'k'.repeat(100),
        message: 'm'.repeat(2500),
        source: 'ignored',
        details: 'not-an-object',
      },
      's'.repeat(150),
    );
    expect(event.timestamp).toBe('2026-05-12T10:00:00.123000+00:00');
    expect(event.kind).toHaveLength(80);
    expect(event.message).toHaveLength(2000);
    expect(event.source).toHaveLength(100);
    expect(event.measured).toBe(true);
    expect(event.details).toEqual({});
    expect(event.uncertainty_ms).toBe(0);
  });

  it('treats a naive timestamp as UTC', () => {
    expect(normalizeEvent({ timestamp: '2026-05-12T10:00:00' }, 'x').timestamp).toBe(
      '2026-05-12T10:00:00+00:00',
    );
  });

  it('honours measured, details and uncertainty', () => {
    const event = normalizeEvent(
      {
        id: 'evt-x',
        timestamp: '2026-05-12T10:00:00+02:00',
        uncertainty_ms: -5,
        measured: false,
        details: { loss: 1 },
      },
      'x',
    );
    expect(event.id).toBe('evt-x');
    expect(event.timestamp).toBe('2026-05-12T08:00:00+00:00');
    expect(event.uncertainty_ms).toBe(0);
    expect(event.measured).toBe(false);
    expect(event.details).toEqual({ loss: 1 });
  });

  it('generates a UUID when the id is missing and crypto is unavailable', () => {
    vi.stubGlobal('crypto', {});
    expect(normalizeEvent({ timestamp: '2026-05-12T10:00:00Z' }, 'x').id).toBe(
      '00000000-0000-4000-8000-000000000000',
    );
  });

  it('rejects missing and malformed timestamps', () => {
    expect(() => normalizeEvent({}, 'x')).toThrow('Each event needs an ISO-8601 timestamp');
    expect(() => normalizeEvent({ timestamp: 'not-a-date' }, 'x')).toThrow(
      'Invalid event timestamp: not-a-date',
    );
  });

  it('rejects a non-numeric uncertainty', () => {
    expect(() =>
      normalizeEvent({ timestamp: '2026-05-12T10:00:00Z', uncertainty_ms: 'abc' }, 'x'),
    ).toThrow('Invalid integer: abc');
  });
});

describe('SHA-256', () => {
  it('matches the standard vectors', () => {
    expect(sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});

describe('ingest', () => {
  it('sorts events by timestamp and fingerprints the canonical list', () => {
    const bundle = ingest(
      [
        '{"id":"late","timestamp":"2026-01-01T00:00:02Z"}',
        '{"id":"early","timestamp":"2026-01-01T00:00:01Z"}',
      ],
      'demo.jsonl',
      'demo',
    );
    expect(bundle.events.map((event) => event.id)).toEqual(['early', 'late']);
    expect(bundle.events[0]?.source).toBe('demo.jsonl');
    expect(bundle.sha256).toHaveLength(64);
  });

  it('rejects empty, oversized, non-object and malformed bundles', () => {
    expect(() => ingest([], 'x', 'x')).toThrow('between 1 and 10000 events');
    expect(() => ingest(Array(MAX_BUNDLE_EVENTS + 1).fill('{}'), 'x', 'x')).toThrow(
      'between 1 and 10000 events',
    );
    expect(() => ingest(['[]'], 'x', 'x')).toThrow('Line 1: JSONL item must be an object');
    expect(() => ingest(['{'], 'x', 'x')).toThrow('Line 1:');
    expect(() => ingest(['{}'], 'x', 'x')).toThrow('Line 1: Each event needs an ISO-8601 timestamp');
  });
});

describe('hypotheses', () => {
  it('fires only when both event kinds are present', () => {
    const bundle = ingest(
      [
        '{"id":"a","timestamp":"2026-01-01T00:00:00Z","kind":"routing-update"}',
        '{"id":"b","timestamp":"2026-01-01T00:00:01Z","kind":"packet-loss"}',
      ],
      'x.jsonl',
      'b1',
    );
    const [hypothesis] = hypothesesFor([bundle]);
    expect(hypothesis?.rule).toBe('route-change-loss');
    expect(hypothesis?.supportingEventIds).toEqual(['a', 'b']);
    expect(hypothesis?.method).toBe(HYPOTHESIS_METHOD);
    expect(hypothesis?.id).toBe('b1:route-change-loss');
  });

  it('returns nothing for a bundle with one kind', () => {
    const bundle = ingest(
      ['{"id":"a","timestamp":"2026-01-01T00:00:00Z","kind":"routing-update"}'],
      'x.jsonl',
      'b1',
    );
    expect(hypothesesFor([bundle])).toEqual([]);
  });
});

describe('minimize', () => {
  it('removes every optional parameter and says what that means', () => {
    const result = minimize(scenarioById('route-buggy'));
    expect(result.removedParameters).toEqual(['hold_down_s', 'prefix_count']);
    expect(result.minimalParameters).toEqual({});
    expect(result.note).toContain('Validate reductions in a real lab');
  });
});

describe('constants', () => {
  it('exposes the backend limits', () => {
    expect(MAX_BUNDLE_EVENTS).toBe(10_000);
    expect(MAX_REPETITIONS).toBe(100);
  });
});
