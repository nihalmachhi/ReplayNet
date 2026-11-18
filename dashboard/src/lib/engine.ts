/**
 * ReplayNet engine, ported from the Python backend.
 *
 * Mirrors `replaynet/measure/confidence.py`, `replaynet/lab/simulator.py`,
 * `replaynet/normalize/*`, the hypothesis rule in `replaynet/service.py` and
 * the SHA-256 fingerprint taken at ingest. The Python simulator uses
 * `random.Random(seed)`, so this file implements CPython's MT19937 seeding and
 * `random()` path to keep seeded trials bit-identical.
 *
 * Everything here is pure: no React, no network, no timers.
 */

export type Fault = 'route_blackhole' | 'mtu_blackhole' | 'loss_during_failover';
export type Build = 'buggy' | 'fixed';
export type Verdict = 'REPRODUCED' | 'INCONCLUSIVE' | 'REGRESSION_GUARDED';

export interface Scenario {
  id: string;
  title: string;
  fault: Fault;
  build: Build;
  parameters: Record<string, number | string | boolean>;
  eventIds: string[];
  oracle: string;
}

export interface RunResult {
  specId: string;
  repetitions: number;
  seed: number;
  failureCount: number;
  failureRate: number;
  wilson95: [number, number];
  verdict: Verdict;
  trials: boolean[];
  lab: 'deterministic-in-process-simulator';
}

export interface NormalizedEvent {
  id: string;
  timestamp: string;
  uncertainty_ms: number;
  source: string;
  kind: string;
  message: string;
  measured: boolean;
  details: Record<string, unknown>;
}

export interface Bundle {
  id: string;
  source: string;
  events: NormalizedEvent[];
  sha256: string;
}

export interface Hypothesis {
  id: string;
  bundleId: string;
  rule: string;
  title: string;
  supportingEventIds: string[];
  method: string;
}

export interface MinimizeResult {
  specId: string;
  originalParameters: Record<string, number | string | boolean>;
  minimalParameters: Record<string, never>;
  removedParameters: string[];
  method: string;
  note: string;
}

export const MAX_BUNDLE_EVENTS = 10_000;
export const MAX_REPETITIONS = 100;
export const FAILURE_RATES: Record<Fault, Record<Build, number>> = {
  route_blackhole: { buggy: 0.96, fixed: 0.01 },
  mtu_blackhole: { buggy: 0.93, fixed: 0.02 },
  loss_during_failover: { buggy: 0.91, fixed: 0.03 },
};
export const HYPOTHESIS_METHOD =
  'event-kind co-occurrence heuristic; not a calibrated probability';

/* ------------------------------------------------------------------ *
 * Wilson 95% interval
 * ------------------------------------------------------------------ */

export function wilsonInterval(successes: number, trials: number): [number, number] {
  if (trials <= 0) return [0, 0];
  const p = successes / trials;
  const z = 1.96;
  const denominator = 1 + (z * z) / trials;
  const center = (p + (z * z) / (2 * trials)) / denominator;
  const margin =
    (z * Math.sqrt((p * (1 - p)) / trials + (z * z) / (4 * trials * trials))) / denominator;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}

/* ------------------------------------------------------------------ *
 * CPython-compatible random.Random(seed).random()
 * ------------------------------------------------------------------ */

const N = 624;
const M = 397;
const MATRIX_A = 0x9908b0df;
const UPPER_MASK = 0x80000000;
const LOWER_MASK = 0x7fffffff;

/**
 * A minimal MT19937 with CPython's `init_by_array` seeding. CPython turns a
 * non-negative integer seed into one 32-bit key word, which is exactly what
 * `initByArray([seed])` does here.
 */
export class PythonRandom {
  private readonly mt = new Uint32Array(N);
  private mti = N;

  constructor(seed: number) {
    this.initByArray([seed >>> 0]);
  }

  private initGenrand(seed: number): void {
    this.mt[0] = seed >>> 0;
    for (let index = 1; index < N; index += 1) {
      const previous = this.mt[index - 1];
      this.mt[index] =
        (Math.imul(1812433253, (previous ^ (previous >>> 30)) >>> 0) + index) >>> 0;
    }
    this.mti = N;
  }

  private initByArray(key: number[]): void {
    this.initGenrand(19650218);
    let i = 1;
    let j = 0;
    let k = Math.max(N, key.length);
    for (; k > 0; k -= 1) {
      const previous = this.mt[i - 1];
      this.mt[i] =
        (((this.mt[i] ^ Math.imul((previous ^ (previous >>> 30)) >>> 0, 1664525)) >>> 0) +
          key[j] +
          j) >>>
        0;
      i += 1;
      j += 1;
      if (i >= N) {
        this.mt[0] = this.mt[N - 1];
        i = 1;
      }
      if (j >= key.length) j = 0;
    }
    for (k = N - 1; k > 0; k -= 1) {
      const previous = this.mt[i - 1];
      this.mt[i] =
        (((this.mt[i] ^ Math.imul((previous ^ (previous >>> 30)) >>> 0, 1566083941)) >>> 0) -
          i) >>>
        0;
      i += 1;
      if (i >= N) {
        this.mt[0] = this.mt[N - 1];
        i = 1;
      }
    }
    this.mt[0] = 0x80000000;
  }

  private int32(): number {
    if (this.mti >= N) {
      let index = 0;
      for (; index < N - M; index += 1) {
        const y = ((this.mt[index] & UPPER_MASK) | (this.mt[index + 1] & LOWER_MASK)) >>> 0;
        this.mt[index] = (this.mt[index + M] ^ (y >>> 1) ^ (y & 1 ? MATRIX_A : 0)) >>> 0;
      }
      for (; index < N - 1; index += 1) {
        const y = ((this.mt[index] & UPPER_MASK) | (this.mt[index + 1] & LOWER_MASK)) >>> 0;
        this.mt[index] =
          (this.mt[index + (M - N)] ^ (y >>> 1) ^ (y & 1 ? MATRIX_A : 0)) >>> 0;
      }
      const y = ((this.mt[N - 1] & UPPER_MASK) | (this.mt[0] & LOWER_MASK)) >>> 0;
      this.mt[N - 1] = (this.mt[M - 1] ^ (y >>> 1) ^ (y & 1 ? MATRIX_A : 0)) >>> 0;
      this.mti = 0;
    }
    let y = this.mt[this.mti];
    this.mti += 1;
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  }

  random(): number {
    const high = this.int32() >>> 5;
    const low = this.int32() >>> 6;
    return (high * 67108864 + low) / 9007199254740992;
  }
}

/** One seeded toy-lab trial, matching `replaynet.lab.simulator.simulate`. */
export function simulate(fault: Fault, build: Build, seed: number): boolean {
  return new PythonRandom(seed).random() < FAILURE_RATES[fault][build];
}

function round4(value: number): number {
  return Number(value.toFixed(4));
}

export function verdictFor(build: Build, low: number, high: number): Verdict {
  if (build === 'buggy') return low >= 0.5 ? 'REPRODUCED' : 'INCONCLUSIVE';
  return high < 0.5 ? 'REGRESSION_GUARDED' : 'INCONCLUSIVE';
}

/** Mirrors `ReplayService.run`: seeded trials, Wilson interval, verdict. */
export function runScenario(
  scenario: Scenario,
  repetitions: number,
  seed: number,
): RunResult {
  const trials = Array.from({ length: repetitions }, (_, index) =>
    simulate(scenario.fault, scenario.build, seed + index),
  );
  const failureCount = trials.filter(Boolean).length;
  const [low, high] = wilsonInterval(failureCount, repetitions);
  return {
    specId: scenario.id,
    repetitions,
    seed,
    failureCount,
    failureRate: round4(failureCount / repetitions),
    wilson95: [round4(low), round4(high)],
    verdict: verdictFor(scenario.build, low, high),
    trials,
    lab: 'deterministic-in-process-simulator',
  };
}

/* ------------------------------------------------------------------ *
 * Redaction and normalization
 * ------------------------------------------------------------------ */

const SECRET_TEXT =
  /(authorization|password|passwd|secret|token|api[_-]?key)\s*([:=])\s*([^\s,;]+)/gi;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const IPV4 = /(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?![\w.])/g;
const SECRET_KEY = /(password|passwd|secret|token|api[_-]?key|authorization)/i;

export function redactText(text: string): string {
  return text
    .replace(SECRET_TEXT, (_match, name: string, separator: string) => `${name}${separator}[REDACTED]`)
    .replace(EMAIL, '[REDACTED_EMAIL]')
    .replace(IPV4, '[REDACTED_IP]');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Recursive redaction, matching `replaynet.normalize.redact.redact`. */
export function redact(value: unknown): unknown {
  if (typeof value === 'string') return redactText(value);
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        SECRET_KEY.test(key) ? '[REDACTED]' : redact(item),
      ]),
    );
  }
  return value;
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return '00000000-0000-4000-8000-000000000000';
}

function pythonIso(date: Date): string {
  const iso = date.toISOString();
  const base = iso.slice(0, 19);
  const milliseconds = iso.slice(20, 23);
  return `${base}${milliseconds === '000' ? '' : `.${milliseconds}000`}+00:00`;
}

function parseTimestamp(text: string): Date {
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text);
  const date = new Date(hasZone ? text : `${text}Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid event timestamp: ${text}`);
  return date;
}

function integer(value: unknown, fallback: number): number {
  if (value === undefined || value === null) return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Invalid integer: ${String(value)}`);
  return Math.trunc(number);
}

/** Mirrors `normalize_event` including truncation and UTC formatting. */
export function normalizeEvent(raw: Record<string, unknown>, source: string): NormalizedEvent {
  const timestamp = raw.timestamp;
  if (typeof timestamp !== 'string') {
    throw new Error('Each event needs an ISO-8601 timestamp');
  }
  const parsed = parseTimestamp(timestamp);
  return {
    id: String(raw.id || uuid()),
    timestamp: pythonIso(parsed),
    uncertainty_ms: Math.max(0, integer(raw.uncertainty_ms, 0)),
    source: source.slice(0, 100),
    kind: String(raw.kind ?? 'observation').slice(0, 80),
    message: String(raw.message ?? '').slice(0, 2000),
    measured: Boolean(raw.measured ?? true),
    details: isRecord(raw.details) ? raw.details : {},
  };
}

/* ------------------------------------------------------------------ *
 * Canonical JSON and SHA-256
 * ------------------------------------------------------------------ */

function canonicalJson(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(', ')}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}: ${canonicalJson(value[key])}`)
      .join(', ')}}`;
  }
  return 'null';
}

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
  0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
  0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
  0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
  0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
  0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
  0xc67178f2,
]);

function rotr(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}

/** Small synchronous SHA-256, used for the bundle fingerprint. */
export function sha256Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const bitLength = bytes.length * 8;
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  const words = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + index * 4);
    }
    for (let index = 16; index < 64; index += 1) {
      const s0 =
        rotr(words[index - 15], 7) ^ rotr(words[index - 15], 18) ^ (words[index - 15] >>> 3);
      const s1 =
        rotr(words[index - 2], 17) ^ rotr(words[index - 2], 19) ^ (words[index - 2] >>> 10);
      words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let index = 0; index < 64; index += 1) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + choice + SHA256_K[index] + words[index]) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((word) => word.toString(16).padStart(8, '0'))
    .join('');
}

/* ------------------------------------------------------------------ *
 * Ingest, hypotheses and minimization
 * ------------------------------------------------------------------ */

/** Mirrors `ReplayService.ingest` for a list of JSONL lines. */
export function ingest(lines: string[], source: string, id: string): Bundle {
  if (lines.length === 0 || lines.length > MAX_BUNDLE_EVENTS) {
    throw new Error('Bundle must contain between 1 and 10000 events');
  }
  const events: NormalizedEvent[] = [];
  lines.forEach((line, index) => {
    try {
      const raw: unknown = JSON.parse(line);
      if (!isRecord(raw)) throw new Error('JSONL item must be an object');
      events.push(normalizeEvent(redact(raw) as Record<string, unknown>, source));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Line ${index + 1}: ${message}`);
    }
  });
  events.sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  return {
    id,
    source,
    events,
    sha256: sha256Hex(canonicalJson(events)),
  };
}

const HYPOTHESIS_RULES: Array<{ rule: string; first: string; second: string; title: string }> = [
  {
    rule: 'route-change-loss',
    first: 'routing-update',
    second: 'packet-loss',
    title: 'Route change coincides with packet loss',
  },
  {
    rule: 'mtu-blackhole',
    first: 'icmp-too-big',
    second: 'retransmission',
    title: 'Path MTU signal coincides with retransmission',
  },
];

/** Mirrors `ReplayService.hypotheses`: event-kind co-occurrence, not probability. */
export function hypothesesFor(bundles: Bundle[]): Hypothesis[] {
  const result: Hypothesis[] = [];
  for (const bundle of bundles) {
    const byKind = new Map<string, string[]>();
    for (const event of bundle.events) {
      const ids = byKind.get(event.kind) ?? [];
      ids.push(event.id);
      byKind.set(event.kind, ids);
    }
    for (const rule of HYPOTHESIS_RULES) {
      const first = byKind.get(rule.first) ?? [];
      const second = byKind.get(rule.second) ?? [];
      if (first.length > 0 && second.length > 0) {
        result.push({
          id: `${bundle.id}:${rule.rule}`,
          bundleId: bundle.id,
          rule: rule.rule,
          title: rule.title,
          supportingEventIds: [...first, ...second],
          method: HYPOTHESIS_METHOD,
        });
      }
    }
  }
  return result;
}

/** Mirrors `ReplayService.minimize`, including its honest note. */
export function minimize(scenario: Scenario): MinimizeResult {
  return {
    specId: scenario.id,
    originalParameters: scenario.parameters,
    minimalParameters: {},
    removedParameters: Object.keys(scenario.parameters),
    method: 'single-pass optional-parameter reduction',
    note: 'Toy simulator has no parameterized traffic. Validate reductions in a real lab.',
  };
}
