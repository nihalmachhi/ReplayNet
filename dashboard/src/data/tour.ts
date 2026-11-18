/**
 * The five tabs in the hero tour. Each tab is typed data, not JSX, so the
 * content can be edited without touching `TourWindow.tsx`.
 */
export type Tone = 'ok' | 'no' | 'mu';

export type TourBlock =
  | { type: 'p'; text: string; muted?: boolean }
  | {
      type: 'sp';
      rows: Array<{ tag: string; tone?: Tone; name: string; meta?: string; indent?: number }>;
    }
  | { type: 'rw'; rows: Array<{ key: string; value: string; replacement?: string }> }
  | { type: 'chips'; chips: Array<{ label: string; tone: Tone }> }
  | { type: 'term'; lines: string[] }
  | { type: 'list'; items: string[] }
  | { type: 'asset'; rows: Array<{ key: string; value: string; note?: string }> }
  | { type: 'note'; text: string };

export interface TourTab {
  tab: string;
  heading: string;
  sub: string;
  main: TourBlock[];
  asideHeading: string;
  aside: TourBlock[];
}

export const TOUR_SIDEBAR = {
  items: [
    { label: 'Bundles', count: '2', on: true },
    { label: 'Hypotheses', count: '2', on: false },
    { label: 'Specs', count: '6', on: false },
    { label: 'Runs', count: '0', on: false },
  ],
  groups: [
    {
      title: 'Bundles',
      items: [
        { label: 'route-change.jsonl', tone: 'ok' as Tone },
        { label: 'mtu-change.jsonl', tone: 'ok' as Tone },
      ],
    },
    {
      title: 'Lab',
      items: [{ label: 'deterministic-in-process', tone: 'mu' as Tone }],
    },
  ],
};

export const TOUR_TABS: TourTab[] = [
  {
    tab: 'Ingest',
    heading: 'Evidence in, timeline out',
    sub: 'JSONL bundle · 10,000 event cap',
    main: [
      {
        type: 'p',
        text: 'A bundle is the evidence from one incident. Each JSONL line becomes one event, and the upload is rejected if it is empty, larger than 5 MiB or not an object per line.',
      },
      {
        type: 'term',
        lines: [
          '{"id":"evt-1",',
          ' "timestamp":"2026-05-12T10:00:00Z",',
          ' "kind":"routing-update",',
          ' "message":"Synthetic route next hop changed…",',
          ' "measured":true}',
        ],
      },
    ],
    asideHeading: 'Demo totals',
    aside: [
      {
        type: 'list',
        items: ['Bundles **2**', 'Events **5**', 'Max upload **5 MiB**', 'Max events **10,000**'],
      },
    ],
  },
  {
    tab: 'Sanitize',
    heading: 'Redact before storage',
    sub: 'Recursive, regex-based',
    main: [
      {
        type: 'p',
        text: 'Redaction runs before an event is normalized. Text secrets, email addresses and IPv4 literals are replaced, and any key that looks like a credential is blanked all the way down.',
      },
      {
        type: 'rw',
        rows: [
          { key: 'token=…', value: 'token=fixture-secret', replacement: 'token=[REDACTED]' },
          { key: 'email', value: 'ops@example.com', replacement: '[REDACTED_EMAIL]' },
          { key: 'address', value: '198.51.100.7', replacement: '[REDACTED_IP]' },
        ],
      },
    ],
    asideHeading: 'What is not redacted',
    aside: [
      {
        type: 'p',
        text: 'IPv6 addresses, hostnames and free-form identifiers are not matched. The regexes are deliberately narrow and easy to audit.',
      },
      { type: 'note', text: 'Redaction reduces risk; it is not a guarantee of anonymity.' },
    ],
  },
  {
    tab: 'Normalize',
    heading: 'One shape, one order',
    sub: 'UTC ISO-8601',
    main: [
      {
        type: 'p',
        text: 'Timestamps become UTC ISO-8601, missing ids become UUIDs, and every field is truncated to a fixed limit. Events are then sorted by timestamp before the bundle digest is taken.',
      },
      {
        type: 'term',
        lines: [
          '{',
          '  "id": "evt-3",',
          '  "timestamp": "2026-05-12T10:00:03+00:00",',
          '  "uncertainty_ms": 0,',
          '  "source": "route-change.jsonl",',
          '  "kind": "recovery",',
          '  "message": "Synthetic prior next hop restored; token=[REDACTED]",',
          '  "measured": true',
          '}',
        ],
      },
    ],
    asideHeading: 'Field limits',
    aside: [
      {
        type: 'list',
        items: [
          'source **100 chars**',
          'kind **80 chars**',
          'message **2,000 chars**',
          'uncertainty **≥ 0 ms**',
        ],
      },
    ],
  },
  {
    tab: 'Replay',
    heading: 'Seeded toy-lab trials',
    sub: 'seed + i · CPython MT19937',
    main: [
      {
        type: 'p',
        text: 'A scenario is a fault, a build, an oracle and optional parameters. Each trial draws one random number from seed + i, so a run is reproducible without storing the trial list.',
      },
      {
        type: 'sp',
        rows: [
          {
            tag: 'buggy',
            tone: 'no',
            name: 'route blackhole',
            meta: 'failure rate 0.96',
          },
          { tag: 'buggy', tone: 'no', name: 'MTU blackhole', meta: 'failure rate 0.93' },
          { tag: 'buggy', tone: 'no', name: 'loss during failover', meta: 'failure rate 0.91' },
          { tag: 'fixed', tone: 'ok', name: 'all three', meta: 'failure rate 0.01–0.03' },
        ],
      },
      { type: 'note', text: 'One seeded draw per trial. Not a protocol emulator.' },
    ],
    asideHeading: 'Seed 7 · 20 trials',
    aside: [
      {
        type: 'list',
        items: [
          'Failures **19**',
          'Observed rate **0.95**',
          'Wilson 95% **0.7639–0.9911**',
          'Verdict **REPRODUCED**',
        ],
      },
    ],
  },
  {
    tab: 'Measure',
    heading: 'The interval decides',
    sub: 'Wilson 95% · z = 1.96',
    main: [
      {
        type: 'p',
        text: 'A buggy build counts as reproduced when the lower bound is at or above 0.5. A fixed build counts as regression guarded when the upper bound is below 0.5. Everything else is inconclusive.',
      },
      {
        type: 'chips',
        chips: [
          { label: 'REPRODUCED · low ≥ 0.5', tone: 'no' },
          { label: 'INCONCLUSIVE', tone: 'mu' },
          { label: 'REGRESSION_GUARDED · high < 0.5', tone: 'ok' },
        ],
      },
      { type: 'note', text: 'Not a calibrated probability of a real outage.' },
    ],
    asideHeading: 'Why an interval',
    aside: [
      {
        type: 'p',
        text: 'One good run proves nothing. The interval keeps the sample size visible, so a 3-trial pass cannot look as strong as a 50-trial pass.',
      },
    ],
  },
];
