"""
cli.py
Entry point: dpdp-scan <path>

Walks a directory, finds AI/LLM call sites, assesses each for likely
personal-data exposure, maps findings to DPDP Act obligations, and
writes a JSON + Markdown report.
"""

import argparse
import sys
from pathlib import Path

import yaml

from discovery import scan_directory, scan_file
from dataflow import assess, get_function_source
from report import build_report, write_json, write_markdown


def load_rules() -> dict:
    rules_path = Path(__file__).parent / "rules" / "dpdp_rules.yaml"
    with open(rules_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)["rules"]


def enrich_finding(call_site, rules: dict) -> dict:
    file_path = Path(call_site.file)
    function_source = get_function_source(file_path, call_site.function_scope)
    dataflow_result = assess(call_site.payload_args, function_source)

    rule = rules.get(dataflow_result.risk_level, rules["LOW"])

    return {
        "file": call_site.file,
        "line": call_site.line,
        "vendor": call_site.vendor,
        "matched_signature": call_site.matched_signature,
        "call_source": call_site.call_source,
        "payload_args": call_site.payload_args,
        "function_scope": call_site.function_scope,
        "risk_level": dataflow_result.risk_level,
        "dataflow_reasons": dataflow_result.reasons,
        "obligations": rule["obligations"],
        "remediation": rule["remediation"],
    }


def main():
    parser = argparse.ArgumentParser(
        prog="dpdp-scan",
        description="Scan a codebase for AI/LLM API usage and flag likely DPDP Act obligations.",
    )
    parser.add_argument("path", help="Path to a Python file or directory to scan")
    parser.add_argument("-o", "--output", default="dpdp-scan-report", help="Output file prefix (default: dpdp-scan-report)")
    args = parser.parse_args()

    target = Path(args.path)
    if not target.exists():
        print(f"Error: path does not exist: {target}", file=sys.stderr)
        sys.exit(1)

    rules = load_rules()

    if target.is_file():
        call_sites = scan_file(target)
    else:
        call_sites = scan_directory(target)

    enriched = [enrich_finding(cs, rules) for cs in call_sites]
    report = build_report(enriched, scan_root=str(target))

    json_path = Path(f"{args.output}.json")
    md_path = Path(f"{args.output}.md")
    write_json(report, json_path)
    write_markdown(report, md_path)

    s = report["summary"]
    print(f"Scanned: {target}")
    print(f"AI call sites found: {s['total_ai_call_sites']}")
    print(f"  HIGH risk:   {s['high_risk']}")
    print(f"  MEDIUM risk: {s['medium_risk']}")
    print(f"  LOW risk:    {s['low_risk']}")
    print(f"\nReports written to:\n  {json_path}\n  {md_path}")


if __name__ == "__main__":
    main()
