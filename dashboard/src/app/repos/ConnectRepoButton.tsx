"use client";

import { useState } from "react";
import ApiKeyReveal from "./ApiKeyReveal";

export default function ConnectRepoButton({
  githubRepoId,
  owner,
  name,
}: {
  githubRepoId: number;
  owner: string;
  name: string;
}) {
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "done"; rawKey: string; repoId: string }
  >({ status: "idle" });

  async function handleConnect() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubRepoId, owner, name }),
      });
      const body = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: body.error ?? "Failed to connect repo" });
        return;
      }
      setState({ status: "done", rawKey: body.rawKey, repoId: body.repoId });
    } catch {
      setState({ status: "error", message: "Network error" });
    }
  }

  if (state.status === "done") {
    return (
      <ApiKeyReveal repoId={state.repoId} rawKey={state.rawKey} owner={owner} name={name} />
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleConnect}
        disabled={state.status === "loading"}
        className="btn btn-secondary text-sm"
      >
        {state.status === "loading" ? "Connecting…" : "Connect"}
      </button>
      {state.status === "error" && (
        <p className="mt-1 text-xs text-[var(--risk-high-ink)]">{state.message}</p>
      )}
    </div>
  );
}
