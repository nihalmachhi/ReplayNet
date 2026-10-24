<p align="center">
  <img src="assets/readme-icon.png" alt="ReplayNet icon" width="112" />
</p>

<h1 align="center">ReplayNet</h1>

**Turn network incidents into repeatable, measurable regression tests.**

ReplayNet takes sanitized evidence from a network incident, builds a clean timeline out of it, and lets you replay the failure as a deterministic scenario, run it many times with fixed seeds, and put a confidence interval on the result. The point is simple: after an outage, you should be able to *prove* your fix works, not just hope it does.

---

## The problem

Network incidents are painful in a very specific way:

- **The evidence is messy and risky to share.** Logs from a real incident usually contain tokens, email addresses and IP addresses. People either paste them around unredacted or don't share them at all.
- **Postmortems don't repeat.** A write-up says "route change caused packet loss", but nobody can re-run that situation. The lesson lives in a document, not in a test.
- **Fixes are verified by feel.** A change goes out, the graph looks calmer, and everyone moves on. Was it the fix, or was it luck? One good run proves nothing.
- **Timelines are inconsistent.** Evidence comes from different systems with different timezones and formats, so reconstructing "what happened first" becomes manual guesswork.

## What ReplayNet does

| Step | What happens |
|------|--------------|
| **1. Ingest** | Upload incident evidence as JSONL, fully offline. |
| **2. Sanitize** | Secrets, email addresses and IPv4 strings are redacted *before* anything is stored. |
| **3. Normalize** | Events are converted to UTC and ordered into one timeline. |
| **4. Fingerprint** | A SHA-256 digest of the sanitized evidence is saved so you can show the bundle hasn't changed. |
| **5. Define a scenario** | Describe the failure conditions as a scenario. |
| **6. Replay** | Run it repeatedly with seeded randomness, so every run is reproducible. |
| **7. Measure** | Get a pass/fail rate with a **Wilson 95% confidence interval**, not a single anecdotal result. |
| **8. Reduce** | A basic parameter reducer narrows down which settings actually matter for the failure. |

## Why it matters (impact)

- **Incidents become assets.** Every outage can leave behind a scenario that runs in CI instead of a document nobody reopens.
- **Safer evidence sharing.** Redaction happens at ingest, so the stored copy is already sanitized and the digest makes tampering detectable.
- **Fix verification with numbers.** "It passed 97 of 100 seeded runs (95% CI: ...)" is a much stronger statement than "it looks fine now". The Wilson interval behaves well on small sample sizes and rates near 0% or 100%, which is exactly where reliability testing lives.
- **Reproducibility.** Fixed seeds mean a teammate can re-run your exact result and get the same answer.
- **Less guesswork when debugging.** The reducer points at which parameters drive the failure, so you start from a short list rather than the whole config.
- **Access control from day one.** Every API route except health is behind viewer / operator / admin checks.

## Project layout

```
ReplayNet/
├── replaynet/            # API, ingestion, sanitizer, simulator, reducer
├── dashboard/            # React dashboard (bundle listing)
├── fixtures/incidents/   # Sample incident evidence (e.g. route-change.jsonl)
├── output/reports/       # Generated reports
├── docs/                 # Documentation
├── tests/                # pytest suite
├── .env.example          # Local config template
└── pyproject.toml        # Python project config (managed with uv)
```

## Architecture and how it works

ReplayNet converts sanitized incident evidence into a repeatable scenario and estimates its pass rate across deterministic seeded runs.

```mermaid
flowchart TD
  A[Sanitized incident JSONL] --> B[Redact supported sensitive fields]
  B --> C[Normalize timestamps to UTC]
  C --> D[Validate and fingerprint evidence]
  D --> E[(SQLite evidence store)]
  E --> F[Build deterministic scenario]
  F --> G[Run repeated seeded simulations]
  G --> H[Pass rate and Wilson 95% interval]
  G --> I[Parameter reducer]
  H --> J[Role-checked API]
  I --> J
  J --> K[React dashboard and reports]
  G -. local simulation only .-> L[No live network changes]
```

The simulation never captures packets or changes a live network. Fixed seeds make runs reproducible; confidence intervals describe the configured simulator, not production reliability. Evidence is stored locally after the supported redaction pass.

## Getting started

**Requirements:** Python 3.11+, Node.js 20+, [uv](https://docs.astral.sh/uv/)

### 1. Backend

```powershell
cd ReplayNet
uv sync --extra dev
Copy-Item .env.example .env
uv run python -m replaynet
```

Interactive API docs: <http://127.0.0.1:8000/docs>

### 2. Dashboard

In a second terminal:

```powershell
cd ReplayNet\dashboard
npm install
npm run dev
```

Paste an API token into the token field in the dashboard to read bundles from the local API.

### 3. Upload evidence

```powershell
$headers = @{ Authorization = 'Bearer local-operator-token' }
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/v1/bundles -Method Post -Headers $headers -Form @{ file = Get-Item .\fixtures\incidents\route-change.jsonl }
```

## Roles

| Role | Can do |
|------|--------|
| **viewer** | Read bundles and results |
| **operator** | Everything a viewer can, plus ingest evidence and create/run scenarios |
| **admin** | Inherits all operator permissions |

> The tokens in `.env.example` are for local demos only. Replace them with unique random values in your own `.env`.

## Testing

```bash
uv run pytest
npm --prefix dashboard run build
```

## Safety boundary and limitations

ReplayNet is honest about what it is and isn't, and you should be too when you use it:

- The lab is an **in-process deterministic simulator**. It does **not** capture packets, configure interfaces, or change any real network.
- Probabilities in scenarios are **synthetic workflow fixtures**, not production measurements. Results show how a scenario behaves under the assumptions you set, not how your live network will behave.
- The reducer is a **single-pass simplification**, not full delta debugging.
- Redaction covers secrets, email addresses and IPv4 strings. Other sensitive data (IPv6, hostnames, custom identifiers) is not covered yet.
- Data is stored in SQLite under the git-ignored `data/` folder. Review your redaction and retention needs before loading sensitive live evidence.

## Roadmap

- [ ] IPv6 and hostname redaction
- [ ] Full delta-debugging reducer
- [ ] Scenario results exported to CI-friendly reports
- [ ] Richer dashboard: timeline view, scenario runs, confidence interval charts
- [ ] Pluggable evidence formats beyond JSONL

## Author

**Nihal Machhi** · [GitHub](https://github.com/nihalmachhi)


