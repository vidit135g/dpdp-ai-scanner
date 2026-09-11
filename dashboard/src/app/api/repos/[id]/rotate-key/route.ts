import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey, hashApiKey } from "@/lib/apiKey";
import { getManageableRepo } from "@/lib/github";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const repo = await prisma.repo.findUnique({ where: { id } });
  if (!repo) {
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });
  }

  const githubRepo = await getManageableRepo(session.user.id, repo.owner, repo.name);
  if (!githubRepo || String(githubRepo.id) !== repo.githubRepoId) {
    return NextResponse.json({ error: "Write access to this repo is required" }, { status: 403 });
  }

  const { rawKey, prefix } = generateApiKey();
  const { hash, salt } = hashApiKey(rawKey);

  await prisma.apiKey.upsert({
    where: { repoId: repo.id },
    update: { keyHash: hash, keySalt: salt, keyPrefix: prefix, lastUsedAt: null },
    create: { repoId: repo.id, keyHash: hash, keySalt: salt, keyPrefix: prefix },
  });

  return NextResponse.json({ rawKey });
}
