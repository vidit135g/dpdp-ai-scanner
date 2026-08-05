import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userCanAccessRepo } from "@/lib/github";
import RiskDonut from "@/components/RiskDonut";
import { RISK_STYLES } from "@/lib/riskBadge";
import ScanDetailView, { type FindingData } from "./ScanDetailView";

export default async function ScanDetailPage({
  params,
}: {
  params: Promise<{ id: string; scanId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { id, scanId } = await params;
  const repo = await prisma.repo.findUnique({ where: { id } });
  if (!repo) notFound();

  const canAccess = await userCanAccessRepo(session.user.id, repo.owner, repo.name);
  if (!canAccess) notFound();

  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: { findings: { orderBy: [{ file: "asc" }, { line: "asc" }] } },
  });
  if (!scan || scan.repoId !== repo.id) notFound();

  const findings: FindingData[] = scan.findings.map((f) => ({
    id: f.id,
    file: f.file,
    line: f.line,
    vendor: f.vendor,
    callSource: f.callSource,
    payloadArgs: f.payloadArgs as Record<string, string>,
    functionScope: f.functionScope,
    riskLevel: f.riskLevel,
    dataflowReasons: f.dataflowReasons as string[],
    obligations: f.obligations as { id: string; title: string; description: string }[],
    remediation: f.remediation,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <Link href={`/repos/${repo.id}`} className="text-sm text-ink-muted hover:text-ink">
        ← {repo.owner}/{repo.name}
      </Link>
      <p className="chip animate-in mt-3">Scan detail</p>
      <h1 className="font-display animate-in mt-3 font-mono text-2xl font-extrabold text-ink sm:text-3xl">
        {scan.commitSha.slice(0, 7)}
        {scan.branch && <span className="ml-2 text-ink-muted">{scan.branch}</span>}
        {scan.prNumber && <span className="ml-2 text-ink-muted">#{scan.prNumber}</span>}
      </h1>
      <p className="mt-2 text-xs text-ink-faint">
        Scanned {scan.createdAt.toLocaleString()} · root <code>{scan.scanRoot}</code>
      </p>

      <div className="card animate-in mt-8 flex items-center gap-6 p-6" style={{ animationDelay: "60ms" }}>
        <RiskDonut high={scan.highCount} medium={scan.mediumCount} low={scan.lowCount} size={110} />
        <div className="flex flex-1 flex-col gap-2 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Risk breakdown for this scan
          </p>
          <div className="flex flex-wrap gap-1.5">
            {scan.highCount > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_STYLES.HIGH}`}>
                {scan.highCount} high
              </span>
            )}
            {scan.mediumCount > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_STYLES.MEDIUM}`}>
                {scan.mediumCount} medium
              </span>
            )}
            {scan.lowCount > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_STYLES.LOW}`}>
                {scan.lowCount} low
              </span>
            )}
            {scan.totalCount === 0 && <span className="text-ink-faint">No findings</span>}
          </div>
        </div>
      </div>

      <ScanDetailView findings={findings} />
    </div>
  );
}
