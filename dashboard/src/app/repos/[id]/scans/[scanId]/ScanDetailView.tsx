"use client";

import { useState } from "react";
import { RISK_STYLES, isRiskLevel } from "@/lib/riskBadge";

export interface FindingData {
  id: string;
  file: string;
  line: number;
  vendor: string;
  callSource: string;
  payloadArgs: Record<string, string>;
  functionScope: string | null;
  riskLevel: string;
  dataflowReasons: string[];
  obligations: { id: string; title: string; description: string }[];
  remediation: string;
}

function RiskBadge({ level }: { level: string }) {
  const style = isRiskLevel(level) ? RISK_STYLES[level] : RISK_STYLES.LOW;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>{level}</span>;
}

export default function ScanDetailView({ findings }: { findings: FindingData[] }) {
  const [view, setView] = useState<"technical" | "compliance">("technical");

  return (
    <div className="mt-8">
      <div className="flex gap-1 border-b border-border">
        {(["technical", "compliance"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`font-display px-3 py-2 text-xs font-bold uppercase tracking-wide ${
              view === v
                ? "border-b-2 border-brand text-ink"
                : "text-ink-faint hover:text-ink-muted"
            }`}
          >
            {v} view
          </button>
        ))}
      </div>

      {findings.length === 0 ? (
        <p className="mt-6 text-sm text-ink-muted">No AI/LLM call sites detected in this scan.</p>
      ) : (
        <div key={view} className="animate-in">
          {view === "technical" ? (
            <TechnicalView findings={findings} />
          ) : (
            <ComplianceView findings={findings} />
          )}
        </div>
      )}
    </div>
  );
}

function TechnicalView({ findings }: { findings: FindingData[] }) {
  return (
    <ul className="mt-6 space-y-4">
      {findings.map((f, i) => (
        <li
          key={f.id}
          className="card card-interactive animate-in p-4"
          style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-sm text-ink">
              {f.file}:{f.line}
            </p>
            <RiskBadge level={f.riskLevel} />
          </div>
          <p className="mt-1 text-xs text-ink-faint">
            {f.vendor} · {f.functionScope ?? "module level"}
          </p>

          <pre className="mt-3 overflow-x-auto rounded-lg bg-canvas p-3 text-xs text-ink">
            {f.callSource}
          </pre>

          {Object.keys(f.payloadArgs).length > 0 && (
            <div className="mt-2 text-xs text-ink-muted">
              {Object.entries(f.payloadArgs).map(([arg, expr]) => (
                <p key={arg}>
                  payload arg <code>{arg}</code> = <code>{expr}</code>
                </p>
              ))}
            </div>
          )}

          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Reasoning</p>
            <ul className="mt-1 list-inside list-disc text-xs text-ink-muted">
              {f.dataflowReasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Obligations triggered
            </p>
            <ul className="mt-1 space-y-1 text-xs text-ink-muted">
              {f.obligations.map((o) => (
                <li key={o.id}>
                  <span className="font-medium text-ink">{o.id}</span> — {o.title}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-3 text-xs text-ink-muted">
            <span className="font-medium text-ink">Remediation: </span>
            {f.remediation.trim()}
          </p>
        </li>
      ))}
    </ul>
  );
}

interface ObligationGroup {
  id: string;
  title: string;
  description: string;
  findings: FindingData[];
}

function groupByObligation(findings: FindingData[]): ObligationGroup[] {
  const groups = new Map<string, ObligationGroup>();
  for (const f of findings) {
    for (const o of f.obligations) {
      const existing = groups.get(o.id);
      if (existing) {
        existing.findings.push(f);
      } else {
        groups.set(o.id, { id: o.id, title: o.title, description: o.description, findings: [f] });
      }
    }
  }
  // Highest-risk-first: sort groups by the worst risk level present, then by finding count.
  const rank = (level: string) => (level === "HIGH" ? 0 : level === "MEDIUM" ? 1 : 2);
  return Array.from(groups.values()).sort((a, b) => {
    const aRank = Math.min(...a.findings.map((f) => rank(f.riskLevel)));
    const bRank = Math.min(...b.findings.map((f) => rank(f.riskLevel)));
    if (aRank !== bRank) return aRank - bRank;
    return b.findings.length - a.findings.length;
  });
}

function ComplianceView({ findings }: { findings: FindingData[] }) {
  const groups = groupByObligation(findings);

  return (
    <div className="mt-6 space-y-4">
      {groups.map((group, i) => (
        <div
          key={group.id}
          className="card card-interactive animate-in p-4"
          style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display text-sm font-semibold text-ink">
                {group.id} — {group.title}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{group.description.trim()}</p>
            </div>
            <span className="shrink-0 rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-ink-muted">
              {group.findings.length} finding{group.findings.length === 1 ? "" : "s"}
            </span>
          </div>

          <p className="mt-3 text-sm text-ink-muted">
            <span className="font-medium text-ink">Remediation: </span>
            {group.findings[0].remediation.trim()}
          </p>

          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-ink-faint hover:text-ink-muted">
              Show affected call sites ({group.findings.length})
            </summary>
            <ul className="mt-2 space-y-1">
              {group.findings.map((f) => (
                <li key={f.id} className="flex items-center gap-2 text-xs">
                  <RiskBadge level={f.riskLevel} />
                  <code className="text-ink-muted">
                    {f.file}:{f.line}
                  </code>
                  <span className="text-ink-faint">({f.vendor})</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      ))}
    </div>
  );
}
