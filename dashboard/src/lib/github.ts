import { prisma } from "@/lib/prisma";

export async function getUserAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });
  return account?.access_token ?? null;
}

/**
 * Checks whether the signed-in user has at least read access to a repo on
 * GitHub, by asking GitHub directly rather than trusting any locally
 * cached permission — so access reflects the user's *current* GitHub
 * permissions, including revocations, in real time.
 */
interface GitHubRepoResponse {
  id: number;
  name: string;
  private: boolean;
  owner: { login: string };
  permissions?: { pull?: boolean; push?: boolean; admin?: boolean };
}

async function fetchGitHubRepo(userId: string, owner: string, name: string): Promise<GitHubRepoResponse | null> {
  const token = await getUserAccessToken(userId);
  if (!token) return null;
  const res = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
  });
  return res.ok ? (await res.json()) as GitHubRepoResponse : null;
}

export async function userCanAccessRepo(
  userId: string,
  owner: string,
  name: string,
  expectedRepoId?: string,
): Promise<boolean> {
  const repo = await fetchGitHubRepo(userId, owner, name);
  return Boolean(repo && (!expectedRepoId || String(repo.id) === expectedRepoId));
}

export async function getManageableRepo(userId: string, owner: string, name: string) {
  const repo = await fetchGitHubRepo(userId, owner, name);
  if (!repo || !(repo.permissions?.push || repo.permissions?.admin)) return null;
  return repo;
}

export interface GitHubRepoSummary {
  id: number;
  owner: string;
  name: string;
  private: boolean;
  canManage: boolean;
}

/** Lists repos the signed-in user has access to, for the "connect a repo" picker. */
export async function listAccessibleRepos(userId: string): Promise<GitHubRepoSummary[]> {
  const token = await getUserAccessToken(userId);
  if (!token) return [];

  const repos: GitHubRepoSummary[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://api.github.com/user/repos?per_page=100&page=${page}&affiliation=owner,collaborator,organization_member`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );
    if (!res.ok) break;

    const batch = (await res.json()) as GitHubRepoResponse[];
    if (batch.length === 0) break;

    repos.push(
      ...batch.map((r) => ({ id: r.id, owner: r.owner.login, name: r.name, private: r.private,
        canManage: Boolean(r.permissions?.push || r.permissions?.admin) })),
    );

    if (batch.length < 100) break;
    page += 1;
  }

  return repos;
}
