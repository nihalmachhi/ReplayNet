/**
 * All visible copy for the site. Components only render these values, so the
 * text can be edited without touching JSX. Numbers that can be derived from the
 * fixtures are derived in the components and tests instead of being duplicated
 * here.
 */
import type { IconName } from '../components/Icon';

export interface LinkCta {
  label: string;
  href: string;
  variant: 'w' | 'plain';
  external?: boolean;
}

export interface SectionHeading {
  lead: string;
  icon: IconName;
  color: string;
  trail: string;
}

export interface MiniSeg {
  label: string;
  flex: number;
  color: string;
}

export type StepMini =
  | { kind: 'lines'; lines: string[] }
  | { kind: 'dots'; dots: Array<'ok' | 'bad'>; line: string }
  | { kind: 'seg'; segments: MiniSeg[]; note: string };

export interface PipelineStep {
  title: string;
  body: string;
  icon: IconName;
  color: string;
  mini: StepMini;
}

export interface BentoCard {
  title: string;
  body: string;
  icon: IconName;
  color: string;
  size: 'normal' | 'wide' | 'full';
  mini?: string[];
  tags?: string[];
}

export interface QuickStep {
  title: string;
  body: string;
  code: Array<{ text: string; comment?: boolean }>;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FooterColumn {
  title: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
}

export const SITE = {
  name: 'ReplayNet',
  repo: 'https://github.com/nihalmachhi/ReplayNet',
  docs: 'https://github.com/nihalmachhi/ReplayNet/tree/main/dashboard/docs',
  source: 'https://github.com/nihalmachhi/ReplayNet/tree/main/replaynet',
  issues: 'https://github.com/nihalmachhi/ReplayNet/issues',
  tagline: 'A local, synthetic incident replay that puts an interval on the fix.',
  disclaimer:
    'Synthetic demo. Incidents, seeds and scores come from a toy in-process simulator, not production traffic.',
  stack: 'Python · SQLite · JSONL',
};

export const NAV_LINKS = [
  { label: 'Pipeline', href: '#how' },
  { label: 'Try it', href: '#try' },
  { label: 'Results', href: '#results' },
  { label: 'Features', href: '#features' },
  { label: 'Quick start', href: '#start' },
  { label: 'FAQ', href: '#faq' },
];

export const HERO = {
  h1: 'Turn one outage into a test you can re-run.',
  p: 'ReplayNet sanitizes incident evidence, builds a UTC timeline, replays the failure with fixed seeds and puts a 95% Wilson interval on the result. The verdict is about the interval, not one lucky run. Offline, deterministic and honest about its limits.',
  ctas: [
    { label: 'Run it locally', href: '#start', variant: 'w' },
    { label: 'View on GitHub', href: SITE.repo, variant: 'plain', external: true },
  ] as LinkCta[],
};

export const HEADINGS = {
  how: {
    lead: 'Three moves.',
    icon: 'check',
    color: '#22c55e',
    trail: 'One measurable answer.',
  },
  try: {
    lead: 'Replay the failure.',
    icon: 'alert',
    color: '#f59e0b',
    trail: 'Watch the interval decide.',
  },
  results: {
    lead: 'Two bundles.',
    icon: 'bars',
    color: '#06b6d4',
    trail: 'Six seeded scenarios.',
  },
  features: {
    lead: 'A small lab.',
    icon: 'cube',
    color: '#8b5cf6',
    trail: 'Built to be inspected.',
  },
  start: {
    lead: 'One minute',
    icon: 'bars',
    color: '#22c55e',
    trail: 'to a seeded replay.',
  },
  scope: {
    lead: 'Built to',
    icon: 'lightbulb',
    color: '#f97316',
    trail: 'teach.',
  },
  faq: {
    lead: 'Any',
    icon: 'question',
    color: '#ec4899',
    trail: 'questions?',
  },
  cta: {
    lead: 'Replay it.',
    icon: 'alert',
    color: '#ef4444',
    trail: 'Then prove it.',
  },
} satisfies Record<string, SectionHeading>;

export const HOW_LEAD =
  'Evidence is redacted and normalized before it is stored, then replayed with fixed seeds. The same three moves run in the browser demo and in the Python service.';

export const STEPS: PipelineStep[] = [
  {
    title: '1. Sanitize',
    body: 'Secrets, email addresses and IPv4 literals are redacted before storage, and secret-looking keys are blanked recursively.',
    icon: 'shield',
    color: '#8b5cf6',
    mini: { kind: 'lines', lines: ['token=fixture-secret → token=[REDACTED]'] },
  },
  {
    title: '2. Replay',
    body: 'A scenario is a fault, a build and an oracle. Trial i uses seed + i, so the same seed produces the same run every time.',
    icon: 'bars',
    color: '#f59e0b',
    mini: {
      kind: 'dots',
      dots: [
        'bad',
        'bad',
        'bad',
        'bad',
        'bad',
        'bad',
        'bad',
        'bad',
        'ok',
        'bad',
        'bad',
        'bad',
        'bad',
        'bad',
        'bad',
        'bad',
        'bad',
        'bad',
        'bad',
        'bad',
      ],
      line: 'same seed → same trials, every run',
    },
  },
  {
    title: '3. Measure',
    body: 'A Wilson 95% interval turns the failure count into a verdict: reproduced, inconclusive or regression guarded.',
    icon: 'cube',
    color: '#f97316',
    mini: {
      kind: 'seg',
      segments: [
        { label: 'guarded', flex: 1, color: '#4ade9a' },
        { label: 'inconclusive', flex: 1, color: '#a78bfa' },
        { label: 'reproduced', flex: 1, color: '#ff7a45' },
      ],
      note: 'the interval decides, not one lucky run',
    },
  },
];

export const TRY_LEAD =
  'Pick a fault and a build, set the seed and repetitions, then replay. The simulator is a toy in-process lab, not a protocol emulator, but the seeded trials and the Wilson interval are exactly what the Python backend computes.';

export const RESULTS_LEAD =
  'Six scenarios at 20 trials and seed 7. Every number is computed from the shared fixtures with the same engine the simulator uses.';

export const RESULTS_NOTE =
  'The failure rates come from a deterministic toy simulator, not real traffic. A narrow interval means more trials, not a better network. Confidence intervals describe the toy model only.';

export const BENTO: BentoCard[] = [
  {
    title: 'Five deterministic stages',
    body: 'Redact, normalize, sort, replay, measure. Each stage is a pure function with its own tests.',
    icon: 'filter',
    color: '#8b5cf6',
    size: 'wide',
    tags: ['redact', 'normalize', 'sort', 'replay', 'measure'],
  },
  {
    title: 'CPython-compatible seeds',
    body: 'The browser engine implements MT19937 and Python’s seeding path, so seed 7 produces the same trial string as random.Random(7).',
    icon: 'code',
    color: '#f97316',
    size: 'wide',
    mini: ['random.Random(7) → 0.32383276483316237'],
  },
  {
    title: 'Wilson, not a vibe',
    body: 'A 95% interval on the failure rate, using the same z = 1.96 formula as the backend.',
    icon: 'bars',
    color: '#06b6d4',
    size: 'normal',
    tags: ['95%', 'z = 1.96', 'clamped 0–1'],
  },
  {
    title: 'Evidence-linked hypotheses',
    body: 'Two event-kind rules turn a bundle into a testable hypothesis, with the supporting event ids attached.',
    icon: 'link',
    color: '#22c55e',
    size: 'normal',
    tags: ['route-change-loss', 'mtu-blackhole'],
  },
  {
    title: 'Roles: viewer, operator, admin',
    body: 'Read endpoints need a viewer token; uploads, specs, runs and decisions need operator or admin.',
    icon: 'key',
    color: '#f59e0b',
    size: 'normal',
    tags: ['viewer', 'operator', 'admin'],
  },
  {
    title: 'SQLite storage',
    body: 'Bundles, specs, runs and hypothesis decisions live in one local file under data/, which Git ignores.',
    icon: 'database',
    color: '#ec4899',
    size: 'wide',
    tags: ['bundles', 'specs', 'runs', 'decisions'],
  },
  {
    title: 'Honest minimization',
    body: 'The reducer removes optional parameters in one pass and says so. It cannot shrink what the toy simulator does not model.',
    icon: 'lock',
    color: '#ef4444',
    size: 'wide',
    mini: ['removed: hold_down_s, prefix_count'],
  },
  {
    title: 'Not in this release',
    body: 'Real traffic replay, protocol emulation, live device access, calibrated probabilities, automated remediation and multi-process SQLite are out of scope.',
    icon: 'x',
    color: '#22c55e',
    size: 'full',
    tags: [
      'real traffic',
      'protocol emulation',
      'live devices',
      'calibrated probabilities',
      'remediation',
      'multi-process SQLite',
    ],
  },
];

export const QUICK_STEPS: QuickStep[] = [
  {
    title: '1. Set up',
    body: 'Install the Python dependencies and copy the demo token file.',
    code: [
      { text: 'uv sync --extra dev' },
      { text: 'Copy-Item .env.example .env' },
      { text: '# replace the demo tokens before any real use', comment: true },
    ],
  },
  {
    title: '2. Run the API',
    body: 'Start the loopback service and open the generated docs.',
    code: [
      { text: 'uv run python -m replaynet' },
      { text: '# 127.0.0.1:8000/docs', comment: true },
    ],
  },
  {
    title: '3. Upload and replay',
    body: 'Upload a cleaned bundle, create a spec, then run it with 20 trials.',
    code: [
      { text: '$h = @{ Authorization = "Bearer local-operator-token" }' },
      { text: '$form = @{ file = Get-Item fixtures/incidents/route-change.jsonl }' },
      { text: '$bundle = Invoke-RestMethod -Method Post -Headers $h `' },
      { text: '  -Form $form -Uri http://127.0.0.1:8000/api/v1/bundles' },
      { text: '$spec = @{ title="Route regression"; fault="route_blackhole";' },
      { text: '  build="buggy"; oracle="probe loss stays below 5 percent" }' },
      { text: '$saved = Invoke-RestMethod -Method Post -Headers $h `' },
      { text: '  -ContentType "application/json" `' },
      { text: '  -Uri http://127.0.0.1:8000/api/v1/specs -Body ($spec | ConvertTo-Json)' },
      { text: 'Invoke-RestMethod -Method Post -Headers $h -ContentType "application/json" `' },
      { text: '  -Uri "http://127.0.0.1:8000/api/v1/specs/$($saved.id)/runs" `' },
      { text: '  -Body (@{ repetitions=20; seed=7 } | ConvertTo-Json)' },
    ],
  },
];

export const SCOPE_IN = [
  'Offline JSONL evidence bundles',
  'Recursive redaction before storage',
  'UTC-normalized, sorted timelines',
  'Seeded, deterministic toy-lab trials',
  'Wilson 95% intervals and verdicts',
  'Hypotheses with supporting event ids',
];

export const SCOPE_OUT = [
  'Replaying real production traffic',
  'Emulating routing or transport protocols',
  'Connecting to routers or switches',
  'Calibrated probabilities of a real outage',
  'Automated remediation or device changes',
  'Multi-process or high-availability SQLite',
];

export const FAQ: FaqItem[] = [
  {
    question: 'Does it replay real traffic?',
    answer:
      'No. The lab is a deterministic toy simulator: each trial draws one seeded random number and compares it with a fixed failure rate per fault and build. It is useful for practising the workflow, not for reproducing a production outage.',
  },
  {
    question: 'What is a bundle?',
    answer:
      'A bundle is a JSONL file of incident evidence. Every line must be one JSON object with an ISO-8601 timestamp. The backend accepts up to 10,000 events and 5 MiB per upload.',
  },
  {
    question: 'Is the seed really deterministic?',
    answer:
      'Yes. The TypeScript engine implements CPython’s MT19937 seeding and random() path, so seed 7 and 20 trials produce the same bit string as random.Random(7). Trial i uses seed + i, matching the backend loop.',
  },
  {
    question: 'What does the Wilson interval mean?',
    answer:
      'It is a 95% interval for the failure rate under the toy model. A wide interval means the run is small, not that the network is uncertain. It is not a calibrated probability that a real outage will recur.',
  },
  {
    question: 'How is the verdict chosen?',
    answer:
      'For a buggy build, the fault is reproduced when the lower bound is at or above 0.5. For a fixed build, it is regression guarded when the upper bound is below 0.5. Anything else is inconclusive.',
  },
  {
    question: 'Does it change my network?',
    answer:
      'No. ReplayNet is offline and read-only. It never opens a device session, announces a route or changes a configuration.',
  },
  {
    question: 'Why does the sample bundle fail to upload?',
    answer:
      'The committed fixture ends with a blank line. The backend splits the file into lines and treats the empty line as an event, so the upload returns 422. Strip blank lines first; the dashboard’s fixture data already does.',
  },
  {
    question: 'Why does minimize remove every parameter?',
    answer:
      'The reducer removes optional parameters in a single pass and returns an empty set. The toy simulator has no parameterized traffic, so the response includes a note telling you to validate reductions in a real lab.',
  },
  {
    question: 'Is it ready for production?',
    answer:
      'No. It is a teaching-sized, single-process service with demo tokens and a toy lab. Replace the tokens, keep the API on loopback and do not present its intervals as production measurements.',
  },
];

export const CTA_NODES: Array<{ label: string[]; hub?: boolean }> = [
  { label: ['Incident', 'evidence'] },
  { label: ['Redact', 'secrets'] },
  { label: ['Normalize', 'UTC timeline'] },
  { label: ['Seeded', 'replay'], hub: true },
  { label: ['Wilson', '95% CI'] },
  { label: ['Verdict', 'ship or not'] },
];

export const CTA = {
  heading: 'Replay it.',
  trail: 'Then prove it.',
  ctas: [
    { label: 'View on GitHub', href: SITE.repo, variant: 'w', external: true },
    { label: 'Back to the simulator', href: '#try', variant: 'plain' },
  ] as LinkCta[],
};

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Overview', href: '#top' },
      { label: 'Pipeline', href: '#how' },
      { label: 'Simulator', href: '#try' },
      { label: 'Results', href: '#results' },
    ],
  },
  {
    title: 'Run it',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Quick start', href: '#start' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Source',
    links: [
      { label: 'GitHub', href: SITE.repo, external: true },
      { label: 'Dashboard docs', href: SITE.docs, external: true },
      { label: 'Source code', href: SITE.source, external: true },
      { label: 'Issues', href: SITE.issues, external: true },
    ],
  },
];
