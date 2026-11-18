/**
 * WHAT YOU WILL LEARN
 * - Why the fixtures are executable documentation, not decoration.
 * - How bundle digests pin the redaction and normalization order.
 * - How scenario lookup keeps the simulator honest about its mapping.
 */
import { describe, expect, it } from 'vitest';
import {
  BUNDLES,
  EXPECTED_DIGESTS,
  EXPECTED_RUNS,
  FAULTS,
  HYPOTHESES,
  MTU_CHANGE_BUNDLE,
  ROUTE_CHANGE_BUNDLE,
  SCENARIOS,
  WILSON_CASES,
  bundleForScenario,
  hypothesesForBundle,
  scenarioById,
  scenarioFor,
} from '../data/fixtures';
import { runScenario, wilsonInterval } from '../lib/engine';

describe('bundles', () => {
  it('normalizes two bundles with five events in total', () => {
    expect(BUNDLES).toHaveLength(2);
    expect(BUNDLES.reduce((total, bundle) => total + bundle.events.length, 0)).toBe(5);
    expect(ROUTE_CHANGE_BUNDLE.events.map((event) => event.id)).toEqual(['evt-1', 'evt-2', 'evt-3']);
    expect(MTU_CHANGE_BUNDLE.events.map((event) => event.id)).toEqual(['evt-4', 'evt-5']);
  });

  it('matches the digests produced by the Python backend', () => {
    for (const bundle of BUNDLES) {
      expect(bundle.sha256, bundle.id).toBe(EXPECTED_DIGESTS[bundle.id]);
    }
  });

  it('redacts the fixture secrets and addresses before storage', () => {
    expect(ROUTE_CHANGE_BUNDLE.events[0]?.message).toContain('[REDACTED_IP]');
    expect(ROUTE_CHANGE_BUNDLE.events[2]?.message).toContain('token=[REDACTED]');
    expect(MTU_CHANGE_BUNDLE.events[0]?.message).toContain('[REDACTED_IP]');
    expect(JSON.stringify(BUNDLES)).not.toContain('fixture-secret');
    expect(JSON.stringify(BUNDLES)).not.toContain('198.51.100.7');
  });

  it('sorts events by UTC timestamp', () => {
    for (const bundle of BUNDLES) {
      const timestamps = bundle.events.map((event) => event.timestamp);
      expect(timestamps).toEqual([...timestamps].sort());
      expect(timestamps.every((value) => value.endsWith('+00:00'))).toBe(true);
    }
  });
});

describe('hypotheses', () => {
  it('turns each bundle into one evidence-linked rule', () => {
    expect(HYPOTHESES.map((item) => item.rule)).toEqual(['route-change-loss', 'mtu-blackhole']);
    expect(HYPOTHESES[0]?.supportingEventIds).toEqual(['evt-1', 'evt-2']);
    expect(HYPOTHESES[1]?.supportingEventIds).toEqual(['evt-4', 'evt-5']);
    expect(HYPOTHESES.every((item) => item.method.includes('not a calibrated probability'))).toBe(
      true,
    );
  });

  it('filters hypotheses per bundle', () => {
    expect(hypothesesForBundle(ROUTE_CHANGE_BUNDLE)).toHaveLength(1);
    expect(hypothesesForBundle(MTU_CHANGE_BUNDLE)).toHaveLength(1);
  });
});

describe('scenarios', () => {
  it('has six scenarios covering three faults and two builds', () => {
    expect(SCENARIOS).toHaveLength(6);
    expect(FAULTS).toHaveLength(3);
    for (const fault of FAULTS) {
      expect(scenarioFor(fault, 'buggy').build).toBe('buggy');
      expect(scenarioFor(fault, 'fixed').build).toBe('fixed');
      expect(scenarioFor(fault, 'buggy').fault).toBe(fault);
    }
  });

  it('maps MTU scenarios to the MTU bundle and the rest to route evidence', () => {
    expect(bundleForScenario(scenarioById('mtu-buggy')).id).toBe('bundle-mtu-change');
    expect(bundleForScenario(scenarioById('route-buggy')).id).toBe('bundle-route-change');
    expect(bundleForScenario(scenarioById('loss-buggy')).id).toBe('bundle-route-change');
  });

  it('rejects an unknown scenario', () => {
    expect(() => scenarioById('nope')).toThrow('Unknown scenario: nope');
  });
});

describe('expected runs', () => {
  it('pins every seeded run at 20 trials and seed 7', () => {
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
    }
  });

  it('keeps the Wilson case table aligned with the engine', () => {
    for (const item of WILSON_CASES) {
      const [low, high] = wilsonInterval(item.successes, item.trials);
      expect(low, `${item.successes}/${item.trials}`).toBeCloseTo(item.expected[0], 4);
      expect(high, `${item.successes}/${item.trials}`).toBeCloseTo(item.expected[1], 4);
    }
  });
});
