/**
 * Shared demo data for the simulator and the test suite.
 *
 * Every incident, event id and failure rate here is synthetic. The two bundles
 * are JSONL evidence files with documentation-range addresses; the six
 * scenarios are toy-lab runs whose seeds match CPython's `random.Random`.
 *
 * Expected values are copied from the Python backend, not generated from the
 * TypeScript engine, so the engine tests can catch a real divergence.
 */
import {
  hypothesesFor,
  ingest,
  type Bundle,
  type Fault,
  type Hypothesis,
  type Scenario,
  type Verdict,
} from '../lib/engine';

export const ROUTE_CHANGE_SOURCE = 'route-change.jsonl';

/** Three events: a routing update, packet loss, then recovery. */
export const ROUTE_CHANGE_LINES = [
  '{"id":"evt-1","timestamp":"2026-05-12T10:00:00Z","kind":"routing-update","message":"Synthetic route next hop changed for 203.0.113.0/24","measured":true}',
  '{"id":"evt-2","timestamp":"2026-05-12T10:00:02Z","kind":"packet-loss","message":"Synthetic lab probe loss reached 100 percent","measured":true}',
  '{"id":"evt-3","timestamp":"2026-05-12T10:00:03Z","kind":"recovery","message":"Synthetic prior next hop restored; token=fixture-secret","measured":true}',
];

export const MTU_CHANGE_SOURCE = 'mtu-change.jsonl';

/** Two events: an ICMP too-big signal and a retransmission spike. */
export const MTU_CHANGE_LINES = [
  '{"id":"evt-4","timestamp":"2026-05-12T11:00:00Z","kind":"icmp-too-big","message":"Synthetic ICMP fragmentation-needed from 198.51.100.7","measured":true}',
  '{"id":"evt-5","timestamp":"2026-05-12T11:00:02Z","kind":"retransmission","message":"Synthetic retransmission spike after MTU change","measured":true}',
];

export const ROUTE_CHANGE_BUNDLE: Bundle = ingest(
  ROUTE_CHANGE_LINES,
  ROUTE_CHANGE_SOURCE,
  'bundle-route-change',
);

export const MTU_CHANGE_BUNDLE: Bundle = ingest(
  MTU_CHANGE_LINES,
  MTU_CHANGE_SOURCE,
  'bundle-mtu-change',
);

export const BUNDLES: Bundle[] = [ROUTE_CHANGE_BUNDLE, MTU_CHANGE_BUNDLE];

/** The two event-kind rules fire once each across the two bundles. */
export const HYPOTHESES: Hypothesis[] = hypothesesFor(BUNDLES);

/** SHA-256 values produced by the Python backend for the same cleaned lines. */
export const EXPECTED_DIGESTS: Record<string, string> = {
  'bundle-route-change': '511174843c2e00bfa4a7c35bfaa7d693e2f720810ebde9261b7bca3e2eddea2d',
  'bundle-mtu-change': '54384fb034cb2a90ccc487ccf82acd4920c1969030897879c071666311cc4355',
};

export const SCENARIOS: Scenario[] = [
  {
    id: 'route-buggy',
    title: 'Route blackhole on the pre-fix build',
    fault: 'route_blackhole',
    build: 'buggy',
    parameters: { hold_down_s: 30, prefix_count: 12 },
    eventIds: ['evt-1', 'evt-2', 'evt-3'],
    oracle: 'Synthetic probe loss stays below 5 percent across the seeded trials.',
  },
  {
    id: 'route-fixed',
    title: 'Route blackhole after the next-hop fix',
    fault: 'route_blackhole',
    build: 'fixed',
    parameters: { hold_down_s: 30, prefix_count: 12 },
    eventIds: ['evt-1', 'evt-2', 'evt-3'],
    oracle: 'Synthetic probe loss stays below 5 percent across the seeded trials.',
  },
  {
    id: 'mtu-buggy',
    title: 'MTU blackhole on the pre-fix build',
    fault: 'mtu_blackhole',
    build: 'buggy',
    parameters: { mtu: 1400, clamp_mss: false },
    eventIds: ['evt-4', 'evt-5'],
    oracle: 'Retransmissions settle once the path MTU is discovered.',
  },
  {
    id: 'mtu-fixed',
    title: 'MTU blackhole after MSS clamping',
    fault: 'mtu_blackhole',
    build: 'fixed',
    parameters: { mtu: 1400, clamp_mss: true },
    eventIds: ['evt-4', 'evt-5'],
    oracle: 'Retransmissions settle once the path MTU is discovered.',
  },
  {
    id: 'loss-buggy',
    title: 'Loss during failover on the pre-fix build',
    fault: 'loss_during_failover',
    build: 'buggy',
    parameters: { failover_s: 45, ecmp: true },
    eventIds: ['evt-1', 'evt-2', 'evt-3'],
    oracle: 'No probe window shows total loss during a failover.',
  },
  {
    id: 'loss-fixed',
    title: 'Loss during failover after graceful drain',
    fault: 'loss_during_failover',
    build: 'fixed',
    parameters: { failover_s: 45, ecmp: true },
    eventIds: ['evt-1', 'evt-2', 'evt-3'],
    oracle: 'No probe window shows total loss during a failover.',
  },
];

export interface ExpectedRun {
  scenarioId: string;
  repetitions: number;
  seed: number;
  failureCount: number;
  failureRate: number;
  wilson95: [number, number];
  verdict: Verdict;
  trials: string;
}

/**
 * Six runs at 20 repetitions and seed 7, copied from the Python backend.
 * `trials` is a compact bit string: `1` means the trial reproduced the fault.
 */
export const EXPECTED_RUNS: ExpectedRun[] = [
  {
    scenarioId: 'route-buggy',
    repetitions: 20,
    seed: 7,
    failureCount: 19,
    failureRate: 0.95,
    wilson95: [0.7639, 0.9911],
    verdict: 'REPRODUCED',
    trials: '11111111011111111111',
  },
  {
    scenarioId: 'route-fixed',
    repetitions: 20,
    seed: 7,
    failureCount: 0,
    failureRate: 0,
    wilson95: [0, 0.1611],
    verdict: 'REGRESSION_GUARDED',
    trials: '00000000000000000000',
  },
  {
    scenarioId: 'mtu-buggy',
    repetitions: 20,
    seed: 7,
    failureCount: 18,
    failureRate: 0.9,
    wilson95: [0.699, 0.9721],
    verdict: 'REPRODUCED',
    trials: '11111111011111101111',
  },
  {
    scenarioId: 'mtu-fixed',
    repetitions: 20,
    seed: 7,
    failureCount: 0,
    failureRate: 0,
    wilson95: [0, 0.1611],
    verdict: 'REGRESSION_GUARDED',
    trials: '00000000000000000000',
  },
  {
    scenarioId: 'loss-buggy',
    repetitions: 20,
    seed: 7,
    failureCount: 17,
    failureRate: 0.85,
    wilson95: [0.6396, 0.9476],
    verdict: 'REPRODUCED',
    trials: '11111111011111100111',
  },
  {
    scenarioId: 'loss-fixed',
    repetitions: 20,
    seed: 7,
    failureCount: 0,
    failureRate: 0,
    wilson95: [0, 0.1611],
    verdict: 'REGRESSION_GUARDED',
    trials: '00000000000000000000',
  },
];

/** Wilson intervals used by the engine tests, copied from Python. */
export const WILSON_CASES: Array<{ successes: number; trials: number; expected: [number, number] }> =
  [
    { successes: 9, trials: 10, expected: [0.5958, 0.9821] },
    { successes: 0, trials: 10, expected: [0, 0.2775] },
    { successes: 10, trials: 10, expected: [0.7225, 1] },
    { successes: 1, trials: 1, expected: [0.2065, 1] },
    { successes: 29, trials: 30, expected: [0.8333, 0.9941] },
    { successes: 0, trials: 30, expected: [0, 0.1135] },
    { successes: 5, trials: 10, expected: [0.2366, 0.7634] },
    { successes: 48, trials: 50, expected: [0.8654, 0.989] },
    { successes: 0, trials: 0, expected: [0, 0] },
  ];

export const FAULTS: Fault[] = ['route_blackhole', 'mtu_blackhole', 'loss_during_failover'];

export function scenarioById(id: string): Scenario {
  const scenario = SCENARIOS.find((item) => item.id === id);
  if (!scenario) throw new Error(`Unknown scenario: ${id}`);
  return scenario;
}

export function scenarioFor(fault: Fault, build: 'buggy' | 'fixed'): Scenario {
  return scenarioById(`${fault === 'loss_during_failover' ? 'loss' : fault.split('_')[0]}-${build}`);
}

/** The bundle a scenario replays: MTU runs use the MTU bundle, others the route bundle. */
export function bundleForScenario(scenario: Scenario): Bundle {
  return scenario.fault === 'mtu_blackhole' ? MTU_CHANGE_BUNDLE : ROUTE_CHANGE_BUNDLE;
}

export function hypothesesForBundle(bundle: Bundle): Hypothesis[] {
  return HYPOTHESES.filter((item) => item.bundleId === bundle.id);
}
