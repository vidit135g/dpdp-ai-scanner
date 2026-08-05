"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RepoToConnect {
  githubRepoId: number;
  owner: string;
  name: string;
}

type RepoStatus = "pending" | "connecting" | "adding-secret" | "done" | "manual-needed" | "failed";

const CONCURRENCY = 4;

export default function ConnectAllButton({ repos }: { repos: RepoToConnect[] }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, RepoStatus>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const key = (r: RepoToConnect) => `${r.owner}/${r.name}`;

  async function connectOne(repo: RepoToConnect) {
    const k = key(repo);
    setStatuses((s) => ({ ...s, [k]: "connecting" }));
    try {
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(repo),
      });
      const body = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setStatuses((s) => ({ ...s, [k]: "done" }));
          return;
        }
        setStatuses((s) => ({ ...s, [k]: "failed" }));
        setErrors((e) => ({ ...e, [k]: body.error ?? "Failed to connect" }));
        return;
      }

      setStatuses((s) => ({ ...s, [k]: "adding-secret" }));
      const secretRes = await fetch(`/api/repos/${body.repoId}/github-secret`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawKey: body.rawKey }),
      });
      if (!secretRes.ok) {
        setStatuses((s) => ({ ...s, [k]: "manual-needed" }));
        return;
      }
      setStatuses((s) => ({ ...s, [k]: "done" }));
    } catch {
      setStatuses((s) => ({ ...s, [k]: "failed" }));
      setErrors((e) => ({ ...e, [k]: "Network error" }));
    }
  }

  async function handleConnectAll() {
    if (
      !confirm(
        `Connect all ${repos.length} repos? Each gets a new API key, and the DPDP_DASHBOARD_API_KEY secret is added automatically where you have admin access. You'll still need to add the workflow file yourself.`,
      )
    ) {
      return;
    }
    setRunning(true);
    const initial: Record<string, RepoStatus> = {};
    for (const r of repos) initial[key(r)] = "pending";
    setStatuses(initial);
    setErrors({});

    const queue = [...repos];
    async function worker() {
      while (queue.length > 0) {
        const repo = queue.shift();
        if (!repo) break;
        await connectOne(repo);
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    setRunning(false);
    router.refresh();
  }

  const doneCount = Object.values(statuses).filter((s) => s === "done").length;
  const manualCount = Object.values(statuses).filter((s) => s === "manual-needed").length;
  const failedCount = Object.values(statuses).filter((s) => s === "failed").length;
  const started = Object.keys(statuses).length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={handleConnectAll}
        disabled={running || repos.length === 0}
        className="btn btn-primary text-sm disabled:opacity-60"
      >
        {running
          ? `Connecting… (${doneCount + manualCount + failedCount}/${repos.length})`
          : `Connect all ${repos.length} repos`}
      </button>

      {started && !running && (
        <p className="mt-2 text-xs text-ink-muted">
          {doneCount} connected
          {manualCount > 0 && `, ${manualCount} need the secret added manually`}
          {failedCount > 0 && `, ${failedCount} failed`}.
        </p>
      )}

      {running && (
        <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-xs">
          {repos.map((r) => {
            const k = key(r);
            const status = statuses[k] ?? "pending";
            return (
              <li key={k} className="flex items-center justify-between gap-2 text-ink-faint">
                <span className="truncate font-mono">{k}</span>
                <span
                  className={
                    status === "done"
                      ? "text-[var(--risk-low-ink)]"
                      : status === "failed"
                        ? "text-[var(--risk-high-ink)]"
                        : status === "manual-needed"
                          ? "text-[var(--risk-medium-ink)]"
                          : "text-ink-faint"
                  }
                >
                  {status === "pending" && "Waiting…"}
                  {status === "connecting" && "Connecting…"}
                  {status === "adding-secret" && "Adding secret…"}
                  {status === "done" && "Done"}
                  {status === "manual-needed" && "Manual setup needed"}
                  {status === "failed" && (errors[k] ?? "Failed")}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
