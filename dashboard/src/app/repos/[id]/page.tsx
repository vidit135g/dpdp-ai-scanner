import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userCanAccessRepo } from "@/lib/github";
import { RISK_STYLES } from "@/lib/riskBadge";
import { ChevronRightIcon } from "@/components/icons";
import RiskDonut from "@/components/RiskDonut";
import RiskTrendChart from "@/components/RiskTrendChart";

export default async function RepoScanHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { id } = await params;
  const repo = await prisma.repo.findUnique({ where: { id } });
  if (!repo) notFound();

  const canAccess = await userCanAccessRepo(session.user.id, repo.owner, repo.name);
  if (!canAccess) notFound();

  const scans = await prisma.scan.findMany({
    where: { repoId: repo.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      commitSha: true,
      branch: true,
      prNumber: true,
      totalCount: true,
      highCount: true,
      mediumCount: true,
      lowCount: true,
      createdAt: true,
    },
  });

  const latest = scans[0];

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link href="/repos" className="text-sm text-ink-muted hover:text-ink">
        ← Repos
      </Link>
      <p className="chip animate-in mt-3">Scan history</p>
      <h1 className="font-display animate-in mt-3 break-all text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        {repo.owner}/{repo.name}
      </h1>

      {latest && (
        <div className="card animate-in mt-8 flex items-center gap-6 p-6" style={{ animationDelay: "60ms" }}>
          <RiskDonut high={latest.highCount} medium={latest.mediumCount} low={latest.lowCount} size={110} />
          <div className="flex flex-1 flex-col gap-1.5 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
              Latest scan · {latest.createdAt.toLocaleDateString()}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {latest.highCount > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_STYLES.HIGH}`}>
                  {latest.highCount} high
                </span>
              )}
              {latest.mediumCount > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_STYLES.MEDIUM}`}>
                  {latest.mediumCount} medium
                </span>
              )}
              {latest.lowCount > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_STYLES.LOW}`}>
                  {latest.lowCount} low
                </span>
              )}
              {latest.totalCount === 0 && <span className="text-ink-faint">No findings</span>}
            </div>
          </div>
        </div>
      )}

      {scans.length >= 2 && (
        <div className="card animate-in mt-4 p-6" style={{ animationDelay: "100ms" }}>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Findings per scan over time
          </p>
          <div className="mt-4">
            <RiskTrendChart
              points={[...scans]
                .reverse()
                .map((s) => ({
                  label: s.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
                  high: s.highCount,
                  medium: s.mediumCount,
                  low: s.lowCount,
                }))}
            />
          </div>
        </div>
      )}

      {scans.length === 0 ? (
        <p className="mt-8 text-sm text-ink-muted">
          No scans recorded yet. Once the GitHub Action runs with{" "}
          <code className="rounded bg-surface-hover px-1 py-0.5">dashboard-url</code> configured,
          scans will show up here.
        </p>
      ) : (
        <>
          <p className="mt-10 text-xs font-medium uppercase tracking-wide text-ink-faint">
            All scans ({scans.length})
          </p>
          <ul className="mt-3 space-y-2">
          {scans.map((scan, i) => (
            <li key={scan.id}>
              <Link
                href={`/repos/${repo.id}/scans/${scan.id}`}
                className="card card-interactive animate-in flex items-center justify-between gap-4 p-4"
                style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm text-ink">
                    {scan.commitSha.slice(0, 7)}
                    {scan.branch && <span className="ml-2 text-ink-muted">{scan.branch}</span>}
                    {scan.prNumber && <span className="ml-2 text-ink-muted">#{scan.prNumber}</span>}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {scan.createdAt.toLocaleString()} · {scan.totalCount} call site
                    {scan.totalCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {scan.highCount > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_STYLES.HIGH}`}>
                      {scan.highCount} high
                    </span>
                  )}
                  {scan.mediumCount > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_STYLES.MEDIUM}`}>
                      {scan.mediumCount} med
                    </span>
                  )}
                  {scan.lowCount > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_STYLES.LOW}`}>
                      {scan.lowCount} low
                    </span>
                  )}
                  <ChevronRightIcon className="h-4 w-4 text-ink-faint" />
                </div>
              </Link>
            </li>
          ))}
          </ul>
        </>
      )}
    </div>
  );
}
