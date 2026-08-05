import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/apiKey";
import { scanUploadSchema } from "@/lib/scanReportSchema";

const PREFIX_LEN = 12;

async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const rawKey = authHeader.slice("Bearer ".length).trim();
  if (!rawKey) return null;

  const prefix = rawKey.slice(0, PREFIX_LEN);
  const candidates = await prisma.apiKey.findMany({
    where: { keyPrefix: prefix },
    include: { repo: true },
  });

  const match = candidates.find((c) => verifyApiKey(rawKey, c.keyHash, c.keySalt));
  if (!match) return null;

  await prisma.apiKey.update({
    where: { id: match.id },
    data: { lastUsedAt: new Date() },
  });

  return match.repo;
}

export async function POST(req: NextRequest) {
  const repo = await authenticate(req);
  if (!repo) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  const parsed = scanUploadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid scan report payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const scan = await prisma.scan.create({
    data: {
      repoId: repo.id,
      commitSha: data.commit_sha,
      branch: data.branch ?? null,
      prNumber: data.pr_number ?? null,
      scanRoot: data.scan_root,
      totalCount: data.summary.total_ai_call_sites,
      highCount: data.summary.high_risk,
      mediumCount: data.summary.medium_risk,
      lowCount: data.summary.low_risk,
      findings: {
        create: data.findings.map((f) => ({
          file: f.file,
          line: f.line,
          vendor: f.vendor,
          matchedSignature: f.matched_signature,
          callSource: f.call_source,
          payloadArgs: f.payload_args,
          functionScope: f.function_scope,
          riskLevel: f.risk_level,
          dataflowReasons: f.dataflow_reasons,
          obligations: f.obligations,
          remediation: f.remediation,
        })),
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ scanId: scan.id }, { status: 201 });
}
