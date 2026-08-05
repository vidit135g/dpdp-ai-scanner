import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey, hashApiKey } from "@/lib/apiKey";
import { userCanAccessRepo } from "@/lib/github";

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

  const canAccess = await userCanAccessRepo(session.user.id, repo.owner, repo.name);
  if (!canAccess) {
    return NextResponse.json({ error: "You do not have access to this repo" }, { status: 403 });
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
