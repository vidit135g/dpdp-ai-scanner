"""
Tests for the --fail-on CI exit-code behavior in cli.py.
Runs the CLI as a subprocess against examples/sample_app.py, which is
known to contain HIGH, MEDIUM, and LOW risk call sites (see test_scanner.py).
"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC = ROOT / "src"
SAMPLE = ROOT / "examples" / "sample_app.py"


def run_cli(*extra_args, tmp_path):
    output_prefix = tmp_path / "report"
    result = subprocess.run(
        [sys.executable, str(SRC / "cli.py"), str(SAMPLE), "-o", str(output_prefix), *extra_args],
        capture_output=True,
        text=True,
    )
    return result


def test_default_fail_on_none_exits_zero_despite_high_risk(tmp_path):
    result = run_cli(tmp_path=tmp_path)
    assert result.returncode == 0


def test_fail_on_high_exits_nonzero_when_high_risk_present(tmp_path):
    result = run_cli("--fail-on", "high", tmp_path=tmp_path)
    assert result.returncode == 1


def test_fail_on_medium_exits_nonzero_when_high_risk_present(tmp_path):
    result = run_cli("--fail-on", "medium", tmp_path=tmp_path)
    assert result.returncode == 1


def test_fail_on_none_explicit_exits_zero(tmp_path):
    result = run_cli("--fail-on", "none", tmp_path=tmp_path)
    assert result.returncode == 0
