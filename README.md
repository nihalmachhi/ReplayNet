# ReplayNet

ReplayNet turns sanitized network-incident evidence into repeatable, measurable regression scenarios.

## MVP features

- Offline JSONL ingestion; redact secrets, email addresses, and IPv4 strings before storing.
- UTC-normalized timeline and SHA-256 digest of the sanitized evidence.
- Viewer/operator/admin role checks for every API route except health.
- Scenario definitions, seeded repeated runs, Wilson 95% confidence interval, and a basic parameter reducer.
- Minimal React dashboard for bundle listing.

**Safety boundary:** the lab is an in-process deterministic simulator. It does not capture packets, configure interfaces, or alter a network. Its probabilities are synthetic workflow fixtures, not production measurements. The reducer is a single-pass simplification, not full delta debugging.

## Run on Windows

Requires Python 3.11+ and Node.js 20+.

~~~powershell
cd D:\Projects\Devops_Engineer\ReplayNet
uv sync --extra dev
Copy-Item .env.example .env
uv run python -m replaynet
~~~

Open http://127.0.0.1:8000/docs. Start the dashboard in a second terminal:

~~~powershell
cd D:\Projects\Devops_Engineer\ReplayNet\dashboard
npm install
npm run dev
~~~

The example tokens are for local demonstration only. Replace them in .env with unique random values. Viewer reads; operator can ingest evidence and create/run scenarios; admin inherits those permissions. Dashboard reads from the local API using its token field.

