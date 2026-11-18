# Backend notes

The dashboard is a faithful port of the Python service, not a replacement for
it. This file records what the backend actually does, where it differs from the
demo, and which limitations are visible to a user. No Python source was changed
for the dashboard work.

All observations below were made against the repository at the time of the
dashboard port, with `uv sync --frozen --extra dev` and `uv run pytest -q`.

## Verified behaviour

```text
$ uv run pytest -q
8 passed in 0.36s
$ uv run ruff check .
All checks passed!
```

The eight tests cover role checks on every route, redaction during upload,
invalid JSONL rejection, hypothesis evidence and decision persistence, the
Wilson interval, and the seeded simulator. The service is a single-process
FastAPI app created by `replaynet/api/app.py::create_app`. Every route except
`/health` requires a bearer token; `/health` returns
`{"status": "ok", "mode": "offline-lab"}`.

| Route | Role |
| --- | --- |
| `POST /api/v1/bundles` | operator |
| `GET /api/v1/bundles` | viewer |
| `GET /api/v1/bundles/{id}/timeline` | viewer |
| `GET /api/v1/hypotheses` | viewer |
| `PATCH /api/v1/hypotheses/{id}` | operator |
| `POST /api/v1/specs` | operator |
| `GET /api/v1/specs` | viewer |
| `POST /api/v1/specs/{id}/runs` | operator |
| `POST /api/v1/specs/{id}/minimize` | operator |
| `GET /api/v1/tests` | viewer |

## Limitations and quirks

### 1. The committed sample bundle fails to upload

`fixtures/incidents/route-change.jsonl` ends with `}\n\r\n`. `app.py` splits the
upload with `content.decode("utf-8").splitlines()`, which produces a trailing
empty string, and `service.ingest` then calls `json.loads("")`:

```text
Line 4: Expecting value: line 1 column 1 (char 0)
```

FastAPI returns HTTP 422.

Reproduction:

```powershell
$h = @{ Authorization = 'Bearer local-operator-token' }
Invoke-RestMethod -Method Post -Headers $h `
  -Form @{ file = Get-Item .\fixtures\incidents\route-change.jsonl } `
  -Uri http://127.0.0.1:8000/api/v1/bundles
# 422 Unprocessable Entity
```

**Demo handling.** `src/data/fixtures.ts` holds the three cleaned lines and the
dashboard never uploads anything. The FAQ has an explicit entry for this error
and the QuickStart section shows the cleaned form.

**Suggested backend fix (not applied).** Skip blank lines before parsing:

```python
lines = [line for line in content.decode("utf-8").splitlines() if line.strip()]
```

Add a regression test that uploads the committed fixture unchanged.

### 2. The simulator is a toy, not a protocol emulator

`replaynet/lab/simulator.py` is 15 lines:

```python
def simulate(fault: str, build: str, seed: int) -> bool:
    """Run one seeded toy-lab trial; this is not a protocol emulator."""
    return random.Random(seed).random() < _FAILURE_RATE[(fault, build)]
```

It reads no parameters, opens no socket and models no protocol. The six failure
rates are constants in the same file.

**Demo handling.** The dashboard reproduces the function exactly (including the
CPython MT19937 seeding path) and labels every number as synthetic. The results
note says a narrow interval means more trials, not a better network.

**Consequence.** A scenario's `parameters` field cannot affect a run. See the next
item.

### 3. `minimize` removes every parameter

`service.minimize` returns `minimal_parameters: {}` and
`removed_parameters: list(params)` for any spec, because the toy simulator never
consumes parameters. The response is honest about it:

```text
note: Toy simulator has no parameterized traffic. Validate reductions in a real lab.
```

**Demo handling.** The engine returns the identical shape and the bento card
quotes the note. Nothing in the UI implies a real delta-debugging result.

**Suggested backend fix (not applied).** Either wire parameters into the
simulator, or reject non-empty `parameters` with a 422 so the contract matches
the behaviour.

### 4. CORS allows only the dev server on 5173

```python
allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"]
```

A built preview (`npm run preview`, port 4173) or any other port cannot call the
API from the browser. Requests fail preflight with no CORS header.

**Demo handling.** The dashboard is fully self-contained: it computes every
number in the browser from fixtures and makes no HTTP requests. The README
describes the dev server, which is on the allowed origin.

**Suggested backend fix (not applied).** Read the allowed origins from
`Settings` and document them in `.env.example`.

### 5. Demo tokens are the defaults

`replaynet/config.py` defaults to:

```text
local-viewer-token
local-operator-token
local-admin-token
```

`.env.example` ships the same values. `require_role` compares them with
`hmac.compare_digest`, which is correct, but the tokens themselves are public.

**Demo handling.** QuickStart step 1 says to replace the tokens before any real
use, and the README repeats it. The scope section lists "production tokens" as
out of scope.

### 6. SQLite is single-process

`Store.connect` opens a new connection per call with
`check_same_thread=False`. There is no WAL mode, no busy timeout and no locking
strategy beyond SQLite's defaults. Two writers under load will see
`database is locked`.

**Demo handling.** The bento card and the scope list both name "multi-process or
high-availability SQLite" as out of scope.

**Suggested backend fix (not applied).** Set `PRAGMA journal_mode=WAL` and a
`busy_timeout` at connect time, or move to a real database.

### 7. No pagination or filtering

`GET /api/v1/bundles`, `/specs` and `/tests` return every row, newest first. With
10,000-event bundles allowed per upload, the list payload grows without bound.

**Demo handling.** The dashboard does not call these endpoints, so it cannot hit
the problem. The tour's demo totals are static.

### 8. Redaction has known gaps

`replaynet/normalize/redact.py` matches three patterns:

| Pattern | Example |
| --- | --- |
| secret key/value | `token=abc`, `password: x`, `api_key = y` |
| email | `ops@example.com` |
| IPv4 | `198.51.100.7` |

It does **not** match IPv6 addresses, hostnames, MAC addresses, bearer tokens
without a `key=` shape, or identifiers in URL paths. Key-based blanking covers
`password`, `passwd`, `secret`, `token`, `api_key`/`api-key` and
`authorization`, but not `cookie`, `session` or `private_key`.

**Demo handling.** The Sanitize tab lists exactly what is not redacted and adds
the note "Redaction reduces risk; it is not a guarantee of anonymity."

### 9. Verdict thresholds are a product choice, not statistics

`service.run` uses `low >= 0.5` for a buggy build and `high < 0.5` for a fixed
build. These are reasonable defaults, but they are hard-coded and not exposed as
settings. A team with a stricter reliability bar cannot change them without
editing the service.

**Demo handling.** The Measure tab and the FAQ state the rule explicitly, so a
reader can disagree with it knowingly.

### 10. `event_ids` on a spec are not validated

`ScenarioSpec.event_ids` accepts any list of strings. `service.run` never reads
them, so a spec can reference events that do not exist in any bundle.

**Demo handling.** The dashboard's scenarios reference real fixture event ids
because it displays them next to the evidence, and `fixtures.test.ts` keeps the
mapping honest.

## What the dashboard does not attempt

- Uploading a bundle. The dashboard never talks to the API.
- Editing or deleting a stored bundle, spec, run or decision.
- Real authentication. There is no login flow and no token storage.
- Charts beyond the reference design's bar rows.
- Reporting a calibrated probability. The interval describes the toy model only.

## Verification commands

```powershell
cd ReplayNet
uv sync --frozen --extra dev
uv run pytest -q
uv run ruff check .
```

`uv run ruff format --check .` is not run in CI: the pre-existing backend files
are not formatted to ruff's default style, and reformatting them is outside the
dashboard's scope.
