// Dev-only: mints a database session for the seeded test-user so the
// authenticated UI can be verified in a browser without a real GitHub
// OAuth app. Run with: npx tsx -r dotenv/config scripts/seed-test-session.ts
import { randomBytes } from "crypto";
import { prisma } from "../src/lib/prisma";

async function main() {
  const user = await prisma.user.findUnique({ where: { githubId: "999999" } });
  if (!user) {
    console.error("Run scripts/seed-test-repo.ts first to create the test user.");
    process.exit(1);
  }

  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await prisma.session.create({
    data: { sessionToken, userId: user.id, expires },
  });

  console.log("Session token (set as authjs.session-token cookie):", sessionToken);
}

main().then(() => prisma.$disconnect());
