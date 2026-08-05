"""
report.py
Combines discovery + dataflow + rule findings into JSON and Markdown reports.
"""

import json
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path


def build_report(enriched_findings: list[dict], scan_root: str) -> dict:
    total = len(enriched_findings)
    high = sum(1 for f in enriched_findings if f["risk_level"] == "HIGH")
    medium = sum(1 for f in enriched_findings if f["risk_level"] == "MEDIUM")
    low = sum(1 for f in enriched_findings if f["risk_level"] == "LOW")

    return {
        "tool": "dpdp-ai-scanner",
        "scan_root": scan_root,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_ai_call_sites": total,
            "high_risk": high,
            "medium_risk": medium,
            "low_risk": low,
        },
        "findings": enriched_findings,
    }


def write_json(report: dict, out_path: Path):
    out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")


def write_markdown(report: dict, out_path: Path):
    lines = []
    lines.append("# DPDP AI Exposure Scan Report\n")
    lines.append(f"**Scan root:** `{report['scan_root']}`  ")
    lines.append(f"**Generated:** {report['generated_at']}\n")

    s = report["summary"]
    lines.append("## Summary\n")
    lines.append(f"- Total AI call sites found: **{s['total_ai_call_sites']}**")
    lines.append(f"- High risk (likely personal data to third-party AI vendor): **{s['high_risk']}**")
    lines.append(f"- Medium risk (manual review recommended): **{s['medium_risk']}**")
    lines.append(f"- Low risk / baseline: **{s['low_risk']}**\n")

    if not report["findings"]:
        lines.append("No AI/LLM API call sites detected in the scanned path.\n")
    else:
        lines.append("## Findings\n")
        for i, f in enumerate(report["findings"], 1):
            lines.append(f"### {i}. {f['vendor']} call at `{f['file']}:{f['line']}`\n")
            lines.append(f"- **Risk level:** {f['risk_level']}")
            lines.append(f"- **Function scope:** {f.get('function_scope') or 'module level'}")
            lines.append(f"- **Call:** `{f['call_source']}`")
            if f.get("payload_args"):
                for arg, expr in f["payload_args"].items():
                    lines.append(f"  - payload arg `{arg}` = `{expr}`")
            lines.append(f"- **Reasoning:**")
            for reason in f["dataflow_reasons"]:
                lines.append(f"  - {reason}")
            lines.append(f"- **Obligations triggered:**")
            for ob in f["obligations"]:
                lines.append(f"  - **{ob['id']}** — {ob['title']}: {ob['description'].strip()}")
            lines.append(f"- **Remediation:** {f['remediation'].strip()}\n")

    out_path.write_text("\n".join(lines), encoding="utf-8")
