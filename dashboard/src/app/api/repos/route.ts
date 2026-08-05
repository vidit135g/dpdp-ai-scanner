import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey, hashApiKey } from "@/lib/apiKey";
import { userCanAccessRepo } from "@/lib/github";

const connectRepoSchema = z.object({
  githubRepoId: z.number().int(),
  owner: z.string().min(1),
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = connectRepoSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { githubRepoId, owner, name } = parsed.data;

  // Re-verify against GitHub directly rather than trusting the client's
  // claim — the repo list shown in the UI could theoretically be stale.
  const canAccess = await userCanAccessRepo(session.user.id, owner, name);
  if (!canAccess) {
    return NextResponse.json({ error: "You do not have access to this repo" }, { status: 403 });
  }

  const existing = await prisma.repo.findUnique({ where: { owner_name: { owner, name } } });
  if (existing) {
    return NextResponse.json(
      { error: "Repo is already connected. Use the rotate-key endpoint to issue a new key." },
      { status: 409 },
    );
  }

  const { rawKey, prefix } = generateApiKey();
  const { hash, salt } = hashApiKey(rawKey);

  const repo = await prisma.repo.create({
    data: {
      githubRepoId: String(githubRepoId),
      owner,
      name,
      connectedById: session.user.id,
      apiKey: {
        create: { keyHash: hash, keySalt: salt, keyPrefix: prefix },
      },
    },
  });

  return NextResponse.json({ repoId: repo.id, rawKey }, { status: 201 });
}
