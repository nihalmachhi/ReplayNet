# Learn ReplayNet

This dashboard is a small, self-contained teaching project. It ports the Python
backend's measurement, redaction and replay rules into TypeScript, then lets you
run seeded trials in the browser and inspect the evidence behind every verdict.
Nothing here talks to the API at runtime, captures packets or touches a network
device.

Use this file as a guided tour. Every section names the files involved so you can
read the code next to the explanation.

## 1. The mental model

An incident leaves behind **evidence**: a pile of JSONL lines, each one event.

```text
timestamp              kind              message
10:00:00Z              routing-update    next hop changed for 203.0.113.0/24
10:00:02Z              packet-loss       probe loss reached 100 percent
10:00:03Z              recovery          prior next hop restored
```

A **scenario** turns that evidence into a test:

```text
fault    route_blackhole
build    buggy
oracle   probe loss stays below 5 percent
seed     7
trials   20
```

A **run** replays the scenario and measures it:

```text
failures  19 / 20        observed rate  0.95
Wilson95  0.7639–0.9911  verdict        REPRODUCED
```

The whole product is that chain. Redact the evidence, normalize it, replay it
with fixed seeds, and let an interval decide instead of one lucky run.

## 2. Where the rules live

| Concern | TypeScript | Python source of truth |
| --- | --- | --- |
| Wilson 95% interval | `src/lib/engine.ts` | `replaynet/measure/confidence.py` |
| Seeded trial draw | `src/lib/engine.ts` (`PythonRandom`) | `replaynet/lab/simulator.py` |
| Failure rates | `src/lib/engine.ts` (`FAILURE_RATES`) | `replaynet/lab/simulator.py` |
| Verdict rule | `src/lib/engine.ts` (`verdictFor`) | `replaynet/service.py` (`run`) |
| Redaction regexes | `src/lib/engine.ts` (`redact`) | `replaynet/normalize/redact.py` |
| Event normalization | `src/lib/engine.ts` (`normalizeEvent`) | `replaynet/normalize/events.py` |
| Bundle digest | `src/lib/engine.ts` (`ingest`) | `replaynet/service.py` (`ingest`) |
| Hypothesis rules | `src/lib/engine.ts` (`hypothesesFor`) | `replaynet/service.py` (`hypotheses`) |
| Parameter reducer | `src/lib/engine.ts` (`minimize`) | `replaynet/service.py` (`minimize`) |
| Shared demo data | `src/data/fixtures.ts` | `fixtures/incidents/*.jsonl` |
| Tour content | `src/data/tour.ts` | dashboard copy |
| Marketing copy | `src/data/content.ts` | dashboard copy |

The engine is pure: no React, no DOM, no network. That is why the simulator and
the tests can share it without mocking anything.

## 3. Wilson, not a vibe

`wilsonInterval(successes, trials)` returns the 95% interval for a binomial
proportion using z = 1.96, clamped to `[0, 1]`.

```ts
wilsonInterval(19, 20); // [0.7639, 0.9911]
wilsonInterval(0, 20);  // [0, 0.1611]
wilsonInterval(3, 0);   // [0, 0]  — no trials, no information
```

The formula is the same one in `confidence.py`:

```text
denominator = 1 + z² / n
center      = (p + z² / 2n) / denominator
margin      = z · sqrt(p(1 − p)/n + z² / 4n²) / denominator
interval    = [center − margin, center + margin]
```

Two properties matter for this demo:

- A small sample gives a **wide** interval. Three passing trials produce an
  upper bound well above 0.5, so the run cannot claim to be guarded.
- A rate of exactly 0 or 1 still gets a non-zero interval, because the sample
  could have gone the other way. That is why 20 clean trials produce
  `0.0000–0.1611` rather than `0–0`.

`WILSON_CASES` in `src/data/fixtures.ts` pins thirteen intervals copied from the
Python function. `engine.test.ts` checks the TypeScript against them, so a
formula edit fails the suite instead of quietly changing the page.

## 4. Why the browser reimplements MT19937

`Math.random()` cannot be seeded. To make the browser produce the *same* trials
as `random.Random(seed)` in Python, `engine.ts` implements CPython's Mersenne
Twister seeding path:

1. Expand the integer seed into the 624-word key array.
2. `init_by_array` to fill the state.
3. `genrand_uint32` to pull 32-bit words.
4. `random()` combines two words into a 53-bit double: `(a >> 5) · 2²⁶ + (b >> 6)`
   divided by `2⁵³`.

The test that keeps this honest is one line:

```ts
new PythonRandom(7).random(); // 0.32383276483316237
```

That is the literal value CPython prints. If the seeding path drifts, the value
drifts and the test fails.

A trial is then trivial, and deliberately so:

```ts
simulate(fault, build, seed); // random.Random(seed).random() < FAILURE_RATES[fault][build]
```

`runScenario` calls it once per trial with `seed + i`, exactly like the backend's
`[simulate(spec["fault"], spec["build"], seed + i) for i in range(repetitions)]`.

## 5. Verdicts

```ts
verdictFor('buggy', low, high); // low >= 0.5 ? REPRODUCED : INCONCLUSIVE
verdictFor('fixed', low, high); // high < 0.5 ? REGRESSION_GUARDED : INCONCLUSIVE
```

The asymmetry is intentional. A buggy build is proven only when the *lower*
bound clears 0.5: you need to be confident the fault is common. A fixed build is
proven only when the *upper* bound stays under 0.5: you need to be confident the
fault is rare. Anything in between is honestly called inconclusive.

`EXPECTED_RUNS` pins six runs at 20 trials and seed 7. Each row carries the full
bit string, so a change in seeding, rounding or verdict logic shows up as a
readable diff rather than a slightly different percentage.

## 6. Redaction

`redact` walks the whole JSON object. Strings go through three regexes, and any
key that looks like a credential is blanked outright.

```ts
redactText('token=abc123');          // 'token=[REDACTED]'
redactText('ops@example.com');       // '[REDACTED_EMAIL]'
redactText('from 198.51.100.7');     // 'from [REDACTED_IP]'
redact({ password: 'x' });           // { password: '[REDACTED]' }
```

Two deliberate limits are worth knowing:

- IPv6 addresses and hostnames are **not** matched. The regexes are narrow on
  purpose so they are easy to audit.
- Redaction happens *before* normalization, so the stored event never contains
  the original text. The digest is taken after redaction too.

The fixture bundle proves both: its messages contain `token=fixture-secret` and
`198.51.100.7`, and `fixtures.test.ts` asserts that neither string survives in
the normalized bundle.

## 7. Normalization and the digest

`normalizeEvent` fills defaults and enforces the backend's limits:

| Field | Rule |
| --- | --- |
| `timestamp` | required, ISO-8601, converted to UTC |
| `id` | kept, or a UUID when missing |
| `source` | truncated to 100 characters |
| `kind` | truncated to 80 characters, default `observation` |
| `message` | truncated to 2,000 characters |
| `uncertainty_ms` | integer, never negative |
| `measured` | boolean, default `true` |
| `details` | object, otherwise `{}` |

`ingest` then sorts by timestamp and hashes the canonical JSON:

```ts
sha256Hex(canonicalJson(events));
```

`canonicalJson` reproduces Python's `json.dumps(..., sort_keys=True)` spacing
(`", "` and `": "`), which is why the browser digest equals the backend digest:

```text
bundle-route-change  511174843c2e00bfa4a7c35bfaa7d693e2f720810ebde9261b7bca3e2eddea2d
bundle-mtu-change    54384fb034cb2a90ccc487ccf82acd4920c1969030897879c071666311cc4355
```

`sha256Hex` is a plain synchronous implementation with its own padding, so the
page works in jsdom and in any browser without `crypto.subtle`.

## 8. Hypotheses

Two event-kind rules turn a bundle into a testable claim:

| Rule | Needs both | Title |
| --- | --- | --- |
| `route-change-loss` | `routing-update` + `packet-loss` | Route change coincides with packet loss |
| `mtu-blackhole` | `icmp-too-big` + `retransmission` | Path MTU signal coincides with retransmission |

The rule fires only when *both* kinds are present. The id is
`${bundleId}:${ruleId}`, and the supporting event ids are attached so the UI can
show the evidence. Every hypothesis carries the same method string:

```text
event-kind co-occurrence heuristic; not a calibrated probability
```

That sentence is the point. Co-occurrence is a prompt to investigate, not a
diagnosis.

## 9. The reducer, and why it removes everything

`minimize(scenario)` returns:

```ts
{
  originalParameters: { hold_down_s: 30, prefix_count: 12 },
  minimalParameters: {},
  removedParameters: ['hold_down_s', 'prefix_count'],
  method: 'single-pass optional-parameter reduction',
  note: 'Toy simulator has no parameterized traffic. Validate reductions in a real lab.',
}
```

This mirrors the backend exactly, including the part that looks broken. The toy
simulator never reads parameters, so no parameter can change a trial, so the
reducer removes them all. The honest answer is the note, not a fake minimal set.
`DECISIONS.md` records why this is documented instead of "fixed".

## 10. The simulator state machine

`src/components/simulator/model.ts` holds a reducer with seven actions:

| Action | Effect |
| --- | --- |
| `fault` | change fault, clear the stale run |
| `build` | change build, clear the stale run |
| `repetitions` | clamp to 5–100, clear the stale run |
| `seed` | clamp to 0–2³¹−1, clear the stale run |
| `run` | compute a fresh `RunResult`, select the first event |
| `select` | highlight one event |
| `reset` | return to the initial state |

Clearing the run on every control change is the important behaviour: the chip
never shows a verdict for a scenario you are no longer looking at. The test
`clears a stale run when the scenario changes and resets cleanly` covers it.

Derived values (`currentScenario`, `currentBundle`, `selectedEvent`,
`currentHypotheses`, `comparisonRows`) are plain functions of the state, so the
comparison table cannot drift from the selected scenario.

## 11. Testing strategy

| File | What it pins |
| --- | --- |
| `engine.test.ts` | Wilson values, MT19937 draws, all six runs, verdict edges, redaction, normalization, SHA-256 vectors, ingest errors, hypotheses, minimize |
| `fixtures.test.ts` | bundle contents, digests, sort order, redaction, scenario mapping |
| `format.test.ts` | the small formatting boundary |
| `Simulator.test.tsx` | controls, chip text, trial strip, event selection, clamping |
| `TourWindow.test.tsx` | auto-advance, hover/focus pause, keyboard tabs, reduced motion |
| `Faq.test.tsx` | native `<details>` behaviour and the honest answers |
| `content.test.tsx` | anchor rot, external link safety, banned phrases, no `dangerouslySetInnerHTML` |
| `a11y.test.tsx` | axe over the whole page |

The Playwright suite adds two layers: `smoke.spec.ts` drives the real page in
Chromium (including a mobile width and the seeded run), and `visual.spec.ts`
captures three screenshots with reduced motion so the layout is stable.

Coverage is enforced at 80% lines/statements/functions and 75% branches overall.
The current suite is at ~99% lines, with `src/lib` and `src/data` effectively
fully covered.

## 12. Where the backend differs from the demo

Read `docs/BACKEND-NOTES.md` for the full list. The three that shape the UI:

1. The committed `fixtures/incidents/route-change.jsonl` ends with a blank line,
   so uploading it verbatim returns 422. The dashboard uses cleaned lines and the
   FAQ says so.
2. CORS allows only `localhost:5173` and `127.0.0.1:5173`, so a built preview on
   another port cannot call the API.
3. The API accepts 1–100 repetitions; the slider offers 5–100 in steps of 5 to
   keep the control usable at both ends.

## 13. Reading order

If you are new to the codebase, read in this order:

1. `src/data/fixtures.ts` — what the demo claims.
2. `src/lib/engine.ts` — how it computes that.
3. `src/__tests__/engine.test.ts` — how the claim is pinned.
4. `src/components/simulator/model.ts` — how the UI state changes.
5. `src/components/Simulator.tsx` — how the pieces compose.
6. `src/data/content.ts` — the copy, including the limits.
