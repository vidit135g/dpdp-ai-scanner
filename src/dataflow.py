"""
dataflow.py
Heuristic, function-scope-local taint estimation.

This is NOT full interprocedural data-flow analysis, that's a stretch goal.
For v1: given a payload expression string captured by discovery.py, and the
source of the enclosing function, estimate whether the value being sent to
an AI vendor is likely to contain personal data, based on:

  1. Variable/argument naming patterns (email, phone, address, etc.)
  2. Whether the value's assignment chain touches a known "incoming user
     data" source (request.form, request.json, db cursor fetch, input()).

Returns a risk level: HIGH, MEDIUM, or LOW/CLEAR, plus the reasoning,
so findings are explainable rather than a black-box score.
"""

import ast
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


PII_NAME_PATTERNS = [
    r"email", r"e_?mail", r"phone", r"mobile", r"contact", r"address",
    r"ssn", r"aadhaar", r"pan_?number", r"dob", r"date_of_birth",
    r"customer", r"user_?data", r"user_?info", r"profile", r"full_?name",
    r"first_?name", r"last_?name", r"passport", r"account_?number",
]

INCOMING_DATA_SOURCE_PATTERNS = [
    r"request\.form", r"request\.json", r"request\.args", r"request\.POST",
    r"request\.GET", r"request\.data", r"cursor\.fetch", r"\.query\(",
    r"input\(", r"flask\.request", r"fastapi.*Body", r"json\.loads",
]

PII_NAME_RE = re.compile("|".join(PII_NAME_PATTERNS), re.IGNORECASE)
SOURCE_RE = re.compile("|".join(INCOMING_DATA_SOURCE_PATTERNS), re.IGNORECASE)


@dataclass
class DataflowResult:
    risk_level: str          # "HIGH" | "MEDIUM" | "LOW"
    reasons: list[str]


def _extract_identifiers(expr: str) -> list[str]:
    """Pull variable-like identifiers out of an unparsed expression string."""
    return re.findall(r"[A-Za-z_][A-Za-z0-9_]*", expr)


def _find_assignment_sources(function_source: str, identifier: str) -> list[str]:
    """
    Within a function's source text, find right-hand-side expressions
    assigned to `identifier`. Textual, not full AST def-use, kept simple
    on purpose for v1 explainability.
    """
    pattern = re.compile(rf"\b{re.escape(identifier)}\s*=\s*(.+)")
    return pattern.findall(function_source)


def assess(payload_args: dict, function_source: str) -> DataflowResult:
    reasons = []
    risk = "LOW"

    for arg_name, expr in payload_args.items():
        identifiers = _extract_identifiers(expr)
        # Drop Python keywords/dict-literal keys and common non-variable
        # tokens so we only reason about actual variable references.
        ignore_tokens = {"role", "user", "system", "assistant", "content", "True", "False", "None"}
        candidate_idents = [i for i in identifiers if i not in ignore_tokens]

        # Direct hit: an actual identifier in the expression is PII-flavored.
        direct_pii_hit = next((i for i in candidate_idents if PII_NAME_RE.search(i)), None)
        if direct_pii_hit:
            reasons.append(f"Payload arg '{arg_name}' references a PII-flavored variable: `{direct_pii_hit}`")
            risk = "HIGH"
            continue

        # Direct hit: the expression pulls from a known incoming-data source.
        if SOURCE_RE.search(expr):
            reasons.append(f"Payload arg '{arg_name}' reads directly from an incoming request/data source: `{expr}`")
            risk = "HIGH"
            continue

        # Trace one hop back: does any identifier in the expression trace
        # to an assignment that touches PII naming or an incoming source?
        hop_flagged = False
        for ident in candidate_idents:
            for assignment in _find_assignment_sources(function_source, ident):
                if PII_NAME_RE.search(ident) or PII_NAME_RE.search(assignment):
                    reasons.append(
                        f"Payload arg '{arg_name}' traces to `{ident} = {assignment.strip()}`, PII-flavored"
                    )
                    hop_flagged = True
                    risk = "HIGH"
                elif SOURCE_RE.search(assignment):
                    reasons.append(
                        f"Payload arg '{arg_name}' traces to `{ident} = {assignment.strip()}`, incoming data source"
                    )
                    hop_flagged = True
                    risk = "HIGH"

        if not hop_flagged and risk == "LOW":
            # ambiguous generic identifiers deserve a manual look, not a clean bill
            generic_hit = next(
                (i for i in candidate_idents if re.fullmatch(r"data|payload|context|info", i, re.IGNORECASE)),
                None,
            )
            if generic_hit:
                reasons.append(f"Payload arg '{arg_name}' uses a generic variable name (`{generic_hit}`), manual review recommended")
                risk = "MEDIUM"

    if not reasons:
        reasons.append("No PII-flavored naming or known incoming-data source detected in payload expression(s)")

    return DataflowResult(risk_level=risk, reasons=reasons)


def get_function_source(file_path: Path, function_name: Optional[str]) -> str:
    """Retrieve the source text of a named function within a file, for tracing."""
    if not function_name:
        return ""
    try:
        source = file_path.read_text(encoding="utf-8")
        tree = ast.parse(source)
    except Exception:
        return ""

    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == function_name:
            try:
                return ast.get_source_segment(source, node) or ""
            except Exception:
                return ""
    return ""
