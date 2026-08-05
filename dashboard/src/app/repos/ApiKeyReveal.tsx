"use client";

import { useState } from "react";
import { KeyIcon } from "@/components/icons";

export default function ApiKeyReveal({
  repoId,
  rawKey,
  owner,
  name,
}: {
  repoId: string;
  rawKey: string;
  owner: string;
  name: string;
}) {
  const [copied, setCopied] = useState(false);
  const [secretState, setSecretState] = useState<
    { status: "idle" } | { status: "loading" } | { status: "error"; message: string } | { status: "done" }
  >({ status: "idle" });

  const snippet = `- uses: vidit135g/dpdp-ai-scanner@main
  with:
    dashboard-url: "${typeof window !== "undefined" ? window.location.origin : ""}"
    dashboard-api-key: \${{ secrets.DPDP_DASHBOARD_API_KEY }}`;

  async function addSecretAutomatically() {
    setSecretState({ status: "loading" });
    try {
      const res = await fetch(`/api/repos/${repoId}/github-secret`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawKey }),
      });
      const body = await res.json();
      if (!res.ok) {
        setSecretState({ status: "error", message: body.error ?? "Failed to add secret" });
        return;
      }
      setSecretState({ status: "done" });
    } catch {
      setSecretState({ status: "error", message: "Network error" });
    }
  }

  return (
    <div
      className="mt-3 w-96 max-w-full rounded-xl border p-4 text-sm"
      style={{ borderColor: "var(--risk-medium)", background: "var(--risk-medium-soft)" }}
    >
      <p className="flex items-center gap-1.5 font-medium" style={{ color: "var(--risk-medium-ink)" }}>
        <KeyIcon className="h-4 w-4 shrink-0" />
        Save this key now — it will not be shown again.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 overflow-x-auto rounded bg-canvas px-2 py-1.5 font-mono text-xs text-ink">
          {rawKey}
        </code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(rawKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="shrink-0 rounded border px-2 py-1.5 text-xs font-medium hover:bg-surface-hover"
          style={{ borderColor: "var(--risk-medium)", color: "var(--risk-medium-ink)" }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="mt-3">
        {secretState.status === "done" ? (
          <p className="text-xs font-medium" style={{ color: "var(--risk-low-ink)" }}>
            ✓ Added as <code>DPDP_DASHBOARD_API_KEY</code> in {owner}/{name}. No manual copy-paste
            needed.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={addSecretAutomatically}
              disabled={secretState.status === "loading"}
              className="btn btn-primary h-8 px-3 text-xs disabled:opacity-60"
            >
              {secretState.status === "loading"
                ? "Adding secret to GitHub…"
                : "Add secret to GitHub automatically"}
            </button>
            {secretState.status === "error" && (
              <p className="mt-1.5 text-xs" style={{ color: "var(--risk-high-ink)" }}>
                {secretState.message} You&apos;ll need to add it manually instead (instructions
                below).
              </p>
            )}
          </>
        )}
      </div>

      <p className="mt-3 text-xs" style={{ color: "var(--risk-medium-ink)" }}>
        {secretState.status === "done" ? "Just add" : "Or add it manually: create a secret named"}{" "}
        {secretState.status !== "done" && (
          <>
            <code>DPDP_DASHBOARD_API_KEY</code> in{" "}
            <code>
              {owner}/{name}
            </code>{" "}
            (Settings → Secrets and variables → Actions), then add
          </>
        )}{" "}
        this to your workflow:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-canvas p-2 text-xs text-ink">{snippet}</pre>
    </div>
  );
}
