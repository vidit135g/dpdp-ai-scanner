// One-off dev script to seed a User + Repo + ApiKey for testing the
// ingestion endpoint before the "connect a repo" UI exists.
// Run with: npx tsx scripts/seed-test-repo.ts
import { prisma } from "../src/lib/prisma";
import { generateApiKey, hashApiKey } from "../src/lib/apiKey";

async function main() {
  const user = await prisma.user.upsert({
    where: { githubId: "999999" },
    update: {},
    create: {
      githubId: "999999",
      login: "test-user",
      name: "Test User",
      email: "test-user@example.com",
    },
  });

  const repo = await prisma.repo.upsert({
    where: { owner_name: { owner: "vidit135g", name: "dpdp-ai-scanner" } },
    update: {},
    create: {
      githubRepoId: "123456789",
      owner: "vidit135g",
      name: "dpdp-ai-scanner",
      connectedById: user.id,
    },
  });

  const { rawKey, prefix } = generateApiKey();
  const { hash, salt } = hashApiKey(rawKey);

  await prisma.apiKey.upsert({
    where: { repoId: repo.id },
    update: { keyHash: hash, keySalt: salt, keyPrefix: prefix },
    create: { repoId: repo.id, keyHash: hash, keySalt: salt, keyPrefix: prefix },
  });

  console.log("Seeded repo:", repo.owner + "/" + repo.name);
  console.log("Raw API key (save this, shown once):", rawKey);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
