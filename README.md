# dpdp-ai-scanner

Static analysis tool that scans a Python codebase for AI/LLM API usage,
estimates whether personal data is likely flowing to a third-party AI
processor, and flags the specific obligations that trigger under India's
Digital Personal Data Protection Act, 2023 (DPDP Act).

## Why this exists

Existing shadow-AI detection tools flag AI usage from a security angle.
Existing DPDP compliance platforms (ComplyDP, Blutic, Privy, and others)
are closed-source SaaS focused on consent management and data discovery
across databases. Neither answers a narrower, code-level question:
**"which specific lines of code send personal data to a third-party AI
vendor, and what does the DPDP Act require before that ships?"**

This tool sits in that gap: open source, self-hostable, static analysis
tied directly to DPDP Act obligations at the code level.

It is a triage aid, not a compliance certification and not legal advice.
Findings should be reviewed by qualified counsel.

## What it does

1. **Discovery** — walks a Python codebase and finds every call site that
   matches a known AI/LLM vendor SDK (OpenAI, Anthropic, Azure OpenAI,
   Google Generative AI, LangChain, HuggingFace).
2. **Data-flow estimation** — for each call site, heuristically traces the
   payload back one hop to flag PII-flavored variable names (email, phone,
   address, and similar) or known incoming-data sources (Flask/FastAPI
   request objects, database fetches, `input()`).
3. **Obligation mapping** — maps each finding's risk level to specific
   DPDP Act sections (legal basis under Section 6/7/8, cross-border
   transfer under Section 16, data processor agreement requirements).
4. **Evidence report** — outputs a timestamped JSON report (machine
   readable, CI-friendly) and a Markdown summary (human readable).

## What it deliberately does not do (yet)

- No cross-function or cross-file data-flow tracing (v1 is single-function
  scope, kept simple and explainable on purpose).
- Python only. JavaScript/TypeScript support via `tree-sitter` is planned.
- Heuristic, not exhaustive: expect both false positives and false
  negatives. Every finding includes its reasoning so a human can verify it
  quickly rather than trusting a black-box score.

## Installation

```bash
git clone <repo-url>
cd dpdp-ai-scanner
pip install -r requirements.txt
```

## Usage

```bash
cd src
python3 cli.py /path/to/your/project -o my-scan-report
```

This produces `my-scan-report.json` and `my-scan-report.md` in the current
directory.

### Example

Run against the included example app:

```bash
cd src
python3 cli.py ../examples/sample_app.py -o ../examples/sample-repo-report
```

See [`examples/sample-repo-report.md`](examples/sample-repo-report.md) for
sample output, four call sites, two flagged HIGH risk, one MEDIUM, one LOW.

### CI exit codes

By default the CLI always exits `0`. Pass `--fail-on high` (or `medium`) to
make it exit non-zero when findings at or above that risk level are
present, for use as a CI gate:

```bash
python3 cli.py /path/to/your/project -o my-scan-report --fail-on high
```

## Use as a GitHub Action

This repo is itself a reusable composite Action. Reference it directly by
commit SHA or branch (no Marketplace listing yet):

```yaml
name: DPDP AI Exposure Scan

on:
  pull_request:
    paths: ["**/*.py"]

permissions:
  contents: read
  pull-requests: write   # required to post/update the findings comment

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: vidit135g/dpdp-ai-scanner@main
        with:
          path: .              # default: "."
          fail-on: high         # default: "high" — one of high | medium | none
          comment-on-pr: true   # default: "true"
```

The Action installs its own dependencies, runs the scan, posts (or updates,
on re-runs) a single PR comment with the Markdown report, and fails the
check if findings meet the `fail-on` threshold. See
[`action.yml`](action.yml) for all inputs/outputs and
[`.github/workflows/dpdp-scan.yml`](.github/workflows/dpdp-scan.yml) for
this repo's own dogfooding workflow (scanned against `examples/`, with
`fail-on: none` since the example app is deliberately built to contain a
HIGH risk finding).

## Dashboard

A web dashboard is available for browsing scan history and findings instead
of reading raw JSON/Markdown reports — sign in with GitHub, connect a repo,
and results from the Action land there automatically. See
[`dashboard/README.md`](dashboard/README.md) for screenshots, the connect
flow, and local setup.

## Running tests

```bash
python3 -m pytest tests/ -v
```

## Roadmap

- [ ] JavaScript/TypeScript support via `tree-sitter`
- [x] GitHub Action packaging for CI integration on every PR
- [ ] Optional secondary tagging against ISO/IEC 42001 and NIST AI RMF
      controls, layered on top of the DPDP-first findings
- [ ] Two-hop data-flow tracing across function boundaries within a file

## License

MIT
