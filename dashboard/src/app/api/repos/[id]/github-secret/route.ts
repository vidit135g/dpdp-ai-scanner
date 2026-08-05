import { NextRequest, NextResponse } from "next/server";
import sodium from "libsodium-wrappers";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userCanAccessRepo, getUserAccessToken } from "@/lib/github";

const SECRET_NAME = "DPDP_DASHBOARD_API_KEY";

const bodySchema = z.object({ rawKey: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
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

  const token = await getUserAccessToken(session.user.id);
  if (!token) {
    return NextResponse.json({ error: "No GitHub access token on file" }, { status: 401 });
  }

  const ghHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const pubKeyRes = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.name}/actions/secrets/public-key`,
    { headers: ghHeaders },
  );
  if (!pubKeyRes.ok) {
    const detail = await pubKeyRes.text();
    return NextResponse.json(
      {
        error:
          pubKeyRes.status === 403
            ? "GitHub denied access to this repo's Actions secrets — you likely need admin access on the repo for this to work. Add the secret manually instead."
            : "Could not read this repo's Actions secrets public key from GitHub.",
        detail,
      },
      { status: 502 },
    );
  }
  const { key: publicKeyB64, key_id: keyId } = (await pubKeyRes.json()) as {
    key: string;
    key_id: string;
  };

  await sodium.ready;
  const publicKey = sodium.from_base64(publicKeyB64, sodium.base64_variants.ORIGINAL);
  const sealed = sodium.crypto_box_seal(sodium.from_string(parsed.data.rawKey), publicKey);
  const encryptedValue = sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL);

  const putRes = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.name}/actions/secrets/${SECRET_NAME}`,
    {
      method: "PUT",
      headers: { ...ghHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ encrypted_value: encryptedValue, key_id: keyId }),
    },
  );

  if (!putRes.ok) {
    const detail = await putRes.text();
    return NextResponse.json(
      { error: "GitHub rejected the secret creation request.", detail },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, secretName: SECRET_NAME });
}
