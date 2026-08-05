import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { listAccessibleRepos } from "@/lib/github";
import { prisma } from "@/lib/prisma";
import { RepoIcon, ChevronRightIcon } from "@/components/icons";
import { RISK_STYLES } from "@/lib/riskBadge";
import ConnectRepoGuide from "@/components/ConnectRepoGuide";
import ConnectRepoButton from "./ConnectRepoButton";
import ConnectAllButton from "./ConnectAllButton";
import RotateKeyButton from "./RotateKeyButton";

export default async function ReposPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const githubRepos = await listAccessibleRepos(session.user.id);

  const connectedRepos = await prisma.repo.findMany({
    where: { githubRepoId: { in: githubRepos.map((r) => String(r.id)) } },
    include: {
      apiKey: { select: { keyPrefix: true, lastUsedAt: true } },
      _count: { select: { scans: true } },
    },
  });
  const connectedByGithubId = new Map(connectedRepos.map((r) => [r.githubRepoId, r]));

  const latestScans = await prisma.scan.findMany({
    where: { repoId: { in: connectedRepos.map((r) => r.id) } },
    orderBy: { createdAt: "desc" },
    select: { repoId: true, highCount: true, mediumCount: true, lowCount: true, totalCount: true },
  });
  const latestScanByRepoId = new Map<string, (typeof latestScans)[number]>();
  for (const scan of latestScans) {
    if (!latestScanByRepoId.has(scan.repoId)) latestScanByRepoId.set(scan.repoId, scan);
  }

  const totalScans = connectedRepos.reduce((sum, r) => sum + r._count.scans, 0);
  const aggregate = Array.from(latestScanByRepoId.values()).reduce(
    (acc, s) => ({
      high: acc.high + s.highCount,
      medium: acc.medium + s.mediumCount,
      low: acc.low + s.lowCount,
    }),
    { high: 0, medium: 0, low: 0 },
  );

  const sortedGithubRepos = [...githubRepos].sort((a, b) => {
    const aConnected = connectedByGithubId.has(String(a.id));
    const bConnected = connectedByGithubId.has(String(b.id));
    if (aConnected === bConnected) return 0;
    return aConnected ? -1 : 1;
  });

  const unconnectedRepos = githubRepos
    .filter((r) => !connectedByGithubId.has(String(r.id)))
    .map((r) => ({ githubRepoId: r.id, owner: r.owner, name: r.name }));

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
      <p className="chip animate-in">Dashboard</p>
      <h1 className="animate-in font-display mt-4 text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
        Repos
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Every repo {session.user.login} has access to on GitHub.
      </p>

      {unconnectedRepos.length > 0 && (
        <div className="animate-in mt-6" style={{ animationDelay: "30ms" }}>
          <ConnectAllButton repos={unconnectedRepos} />
        </div>
      )}

      <div className="animate-in mt-8 grid grid-cols-3 gap-3" style={{ animationDelay: "60ms" }}>
        <div className="card p-4">
          <p className="text-2xl font-extrabold text-ink">{githubRepos.length}</p>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Accessible
          </p>
        </div>
        <div className="card p-4">
          <p className="font-display text-2xl font-extrabold text-brand">{connectedRepos.length}</p>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Connected
          </p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-extrabold text-ink">{totalScans}</p>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Scans recorded
          </p>
        </div>
      </div>

      {latestScanByRepoId.size > 0 && (
        <div className="card animate-in mt-4 p-4" style={{ animationDelay: "100ms" }}>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Open findings across connected repos (latest scan each)
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {aggregate.high > 0 && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${RISK_STYLES.HIGH}`}>
                {aggregate.high} high
              </span>
            )}
            {aggregate.medium > 0 && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${RISK_STYLES.MEDIUM}`}>
                {aggregate.medium} medium
              </span>
            )}
            {aggregate.low > 0 && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${RISK_STYLES.LOW}`}>
                {aggregate.low} low
              </span>
            )}
            {aggregate.high === 0 && aggregate.medium === 0 && aggregate.low === 0 && (
              <span className="text-sm text-ink-faint">No findings in the latest scans.</span>
            )}
          </div>
        </div>
      )}

      <ConnectRepoGuide defaultOpen={connectedRepos.length === 0} />

      {githubRepos.length === 0 ? (
        <p className="mt-8 text-sm text-ink-muted">No repos found for your GitHub account.</p>
      ) : (
        <ul className="mt-8 space-y-2">
          {sortedGithubRepos.map((r, i) => {
            const dbRepo = connectedByGithubId.get(String(r.id));
            const latest = dbRepo ? latestScanByRepoId.get(dbRepo.id) : undefined;
            return (
              <li
                key={r.id}
                className="card card-interactive animate-in flex flex-wrap items-center justify-between gap-4 p-4"
                style={{ animationDelay: `${Math.min(i, 10) * 40 + 140}ms` }}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <RepoIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm text-ink">
                      {r.owner}/{r.name}
                      {r.private && (
                        <span className="ml-2 rounded bg-surface-hover px-1.5 py-0.5 text-xs font-sans text-ink-faint">
                          private
                        </span>
                      )}
                      {dbRepo && (
                        <span className="chip ml-2 align-middle text-[10px]">Connected</span>
                      )}
                    </p>
                    {dbRepo && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <p className="text-xs text-ink-faint">
                          {dbRepo._count.scans} scan{dbRepo._count.scans === 1 ? "" : "s"} · key{" "}
                          {dbRepo.apiKey?.keyPrefix}…
                        </p>
                        {latest && latest.totalCount > 0 && (
                          <>
                            {latest.highCount > 0 && (
                              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${RISK_STYLES.HIGH}`}>
                                {latest.highCount} high
                              </span>
                            )}
                            {latest.mediumCount > 0 && (
                              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${RISK_STYLES.MEDIUM}`}>
                                {latest.mediumCount} med
                              </span>
                            )}
                            {latest.lowCount > 0 && (
                              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${RISK_STYLES.LOW}`}>
                                {latest.lowCount} low
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex min-w-0 shrink-0 flex-col items-end gap-2">
                  {dbRepo ? (
                    <>
                      <Link href={`/repos/${dbRepo.id}`} className="btn btn-secondary text-sm">
                        View scans
                        <ChevronRightIcon className="h-3.5 w-3.5" />
                      </Link>
                      <RotateKeyButton repoId={dbRepo.id} owner={r.owner} name={r.name} />
                    </>
                  ) : (
                    <ConnectRepoButton githubRepoId={r.id} owner={r.owner} name={r.name} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
