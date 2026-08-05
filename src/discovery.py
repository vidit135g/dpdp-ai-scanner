"""
discovery.py
Static AST scan of Python source files to find AI/LLM API call sites.

Approach: walk every ast.Call node, resolve the full dotted name of the
function being called (e.g. "openai.ChatCompletion.create" or
"client.messages.create"), and match it against a known set of AI vendor
signatures. This is intentionally conservative (string/pattern matching
on the call expression) rather than resolving imports across the whole
project graph, that's a reasonable v1 tradeoff for a static scanner.
"""

import ast
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


# Known AI/LLM vendor call signatures. Matched as a substring against the
# fully-qualified dotted call name. Extend this list as new SDKs appear.
VENDOR_SIGNATURES = {
    "openai": [
        "openai.ChatCompletion.create",
        "openai.Completion.create",
        "openai.Embedding.create",
        "OpenAI(",              # client construction, chat.completions.create below
        "chat.completions.create",
        "completions.create",
        "responses.create",
    ],
    "anthropic": [
        "anthropic.Anthropic(",
        "Anthropic(",
        "messages.create",
        "completions.create",
    ],
    "azure_openai": [
        "AzureOpenAI(",
        "azure_openai",
    ],
    "google_generativeai": [
        "genai.GenerativeModel",
        "generate_content",
        "google.generativeai",
    ],
    "langchain": [
        "ChatOpenAI(",
        "ChatAnthropic(",
        "LLMChain(",
        "langchain.llms",
        "langchain_openai",
        "langchain_anthropic",
    ],
    "huggingface": [
        "pipeline(",
        "InferenceClient(",
    ],
}

# Keyword arguments that typically carry the actual payload sent to the model.
PAYLOAD_ARG_NAMES = {"messages", "prompt", "input", "contents", "text", "query"}


@dataclass
class CallSite:
    file: str
    line: int
    vendor: str
    matched_signature: str
    call_source: str
    payload_args: dict = field(default_factory=dict)  # arg_name -> source expr string
    function_scope: Optional[str] = None  # enclosing function name, if any


def _dotted_name(node: ast.AST) -> str:
    """Best-effort reconstruction of a dotted call name, e.g. a.b.c(...) -> 'a.b.c('"""
    try:
        return ast.unparse(node)
    except Exception:
        return ""


def _match_vendor(call_str: str):
    for vendor, signatures in VENDOR_SIGNATURES.items():
        for sig in signatures:
            if sig in call_str:
                return vendor, sig
    return None, None


def _enclosing_function_name(func_stack: list) -> Optional[str]:
    return func_stack[-1] if func_stack else None


CONSTRUCTOR_ONLY_SIGNATURES = {
    "OpenAI(", "Anthropic(", "AzureOpenAI(", "ChatOpenAI(", "ChatAnthropic(",
}


def scan_file(path: Path) -> list[CallSite]:
    """Scan a single Python file and return all detected AI/LLM call sites."""
    try:
        source = path.read_text(encoding="utf-8")
        tree = ast.parse(source, filename=str(path))
    except (SyntaxError, UnicodeDecodeError):
        return []

    findings: list[CallSite] = []
    func_stack: list[str] = []

    class Visitor(ast.NodeVisitor):
        def visit_FunctionDef(self, node):
            func_stack.append(node.name)
            self.generic_visit(node)
            func_stack.pop()

        visit_AsyncFunctionDef = visit_FunctionDef

        def visit_Call(self, node: ast.Call):
            call_str = _dotted_name(node.func) + "("
            vendor, sig = _match_vendor(call_str)
            if vendor:
                payload_args = {}
                for kw in node.keywords:
                    if kw.arg in PAYLOAD_ARG_NAMES:
                        try:
                            payload_args[kw.arg] = ast.unparse(kw.value)
                        except Exception:
                            payload_args[kw.arg] = "<unparseable>"
                # also capture first positional arg as a fallback payload
                if node.args and not payload_args:
                    try:
                        payload_args["<positional_0>"] = ast.unparse(node.args[0])
                    except Exception:
                        pass

                # Skip bare client constructors (Anthropic(), OpenAI()) that
                # carry no payload, they're setup, not a data transfer.
                is_constructor_call = any(c in call_str for c in CONSTRUCTOR_ONLY_SIGNATURES)
                if is_constructor_call and not payload_args:
                    self.generic_visit(node)
                    return

                findings.append(CallSite(
                    file=str(path),
                    line=node.lineno,
                    vendor=vendor,
                    matched_signature=sig,
                    call_source=_dotted_name(node),
                    payload_args=payload_args,
                    function_scope=_enclosing_function_name(func_stack),
                ))
            self.generic_visit(node)

    Visitor().visit(tree)
    return findings


def scan_directory(root: Path) -> list[CallSite]:
    """Recursively scan a directory for .py files and collect all call sites."""
    all_findings: list[CallSite] = []
    for py_file in root.rglob("*.py"):
        # skip common noise directories
        if any(part in {".venv", "venv", "__pycache__", "node_modules", ".git"} for part in py_file.parts):
            continue
        all_findings.extend(scan_file(py_file))
    return all_findings
