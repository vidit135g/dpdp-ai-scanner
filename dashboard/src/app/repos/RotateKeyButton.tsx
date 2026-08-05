"use client";

import { useState } from "react";
import ApiKeyReveal from "./ApiKeyReveal";

export default function RotateKeyButton({
  repoId,
  owner,
  name,
}: {
  repoId: string;
  owner: string;
  name: string;
}) {
  const [state, setState] = useState<
    { status: "idle" } | { status: "loading" } | { status: "error"; message: string } | { status: "done"; rawKey: string }
  >({ status: "idle" });

  async function handleRotate() {
    if (!confirm("Rotating the key invalidates the old one immediately. Continue?")) return;
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/repos/${repoId}/rotate-key`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: body.error ?? "Failed to rotate key" });
        return;
      }
      setState({ status: "done", rawKey: body.rawKey });
    } catch {
      setState({ status: "error", message: "Network error" });
    }
  }

  if (state.status === "done") {
    return <ApiKeyReveal repoId={repoId} rawKey={state.rawKey} owner={owner} name={name} />;
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRotate}
        disabled={state.status === "loading"}
        className="text-xs font-medium text-ink-faint underline decoration-dotted underline-offset-2 hover:text-ink disabled:opacity-50"
      >
        {state.status === "loading" ? "Rotating…" : "Rotate key"}
      </button>
      {state.status === "error" && (
        <p className="mt-1 text-xs text-[var(--risk-high-ink)]">{state.message}</p>
      )}
    </div>
  );
}
