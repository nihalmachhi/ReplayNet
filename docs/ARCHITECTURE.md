# Architecture

~~~mermaid
flowchart LR
  E[Offline JSONL evidence] --> R[Redaction]
  R --> N[UTC event normalization]
  N --> H[Digest and SQLite]
  H --> T[Timeline and hypotheses]
  T --> S[Operator-authored scenario]
  S --> L[Seeded in-process simulator]
  L --> M[Repeated trials + Wilson interval]
  M --> V[Transparent oracle verdict]
  V --> G[Dashboard and regression list]
~~~

The API is the access boundary. Viewers inspect bundles and reports; operators import evidence and author or run scenarios; administrators inherit all roles. Data is persisted in a local SQLite database. Evidence is redacted before storage and hashing.

## Limits

- No LLM assigns a verdict; the seeded simulator produces the verdict input.
- The lab is not a protocol emulator and its results do not predict live network behavior.
- Input is bounded UTF-8 JSONL; PCAP parsing and external integrations are outside this MVP.
- The minimizer removes optional fields in one pass; true ddmin requires repeatable parameterized experiments.

