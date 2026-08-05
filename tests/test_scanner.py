"""
Basic regression tests. Run with: pytest tests/
Validates against examples/sample_app.py, which is deliberately built to
contain one call site of each risk level.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from discovery import scan_file
from dataflow import assess, get_function_source

SAMPLE = Path(__file__).parent.parent / "examples" / "sample_app.py"


def test_discovers_four_real_call_sites():
    findings = scan_file(SAMPLE)
    # bare Anthropic() constructor should be filtered out; 4 real call sites remain
    assert len(findings) == 4


def test_flags_pii_variable_as_high_risk():
    findings = scan_file(SAMPLE)
    target = next(f for f in findings if f.function_scope == "summarize_support_ticket")
    function_source = get_function_source(SAMPLE, target.function_scope)
    result = assess(target.payload_args, function_source)
    assert result.risk_level == "HIGH"


def test_flags_incoming_request_data_as_high_risk():
    findings = scan_file(SAMPLE)
    target = next(f for f in findings if f.function_scope == "handle_chat_request")
    function_source = get_function_source(SAMPLE, target.function_scope)
    result = assess(target.payload_args, function_source)
    assert result.risk_level == "HIGH"


def test_flags_generic_variable_as_medium_risk():
    findings = scan_file(SAMPLE)
    target = next(f for f in findings if f.function_scope == "generate_report_summary")
    function_source = get_function_source(SAMPLE, target.function_scope)
    result = assess(target.payload_args, function_source)
    assert result.risk_level == "MEDIUM"


def test_static_system_prompt_is_low_risk():
    findings = scan_file(SAMPLE)
    target = next(f for f in findings if f.function_scope == "get_style_suggestions")
    function_source = get_function_source(SAMPLE, target.function_scope)
    result = assess(target.payload_args, function_source)
    assert result.risk_level == "LOW"
