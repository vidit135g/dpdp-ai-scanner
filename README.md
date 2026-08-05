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

## Running tests

```bash
python3 -m pytest tests/ -v
```

## Roadmap

- [ ] JavaScript/TypeScript support via `tree-sitter`
- [ ] GitHub Action packaging for CI integration on every PR
- [ ] Optional secondary tagging against ISO/IEC 42001 and NIST AI RMF
      controls, layered on top of the DPDP-first findings
- [ ] Two-hop data-flow tracing across function boundaries within a file

## License

MIT
