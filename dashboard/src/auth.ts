import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // `repo` scope is required so signed-in users can be checked for
      // access to *private* repos when deciding what scan history they can
      // see — see lib/github.ts#userCanAccessRepo. This is a broad grant on
      // behalf of the signed-in user; documented in dashboard/README.md.
      authorization: { params: { scope: "read:user user:email repo" } },
      profile(profile) {
        return {
          id: profile.id.toString(),
          githubId: profile.id.toString(),
          login: profile.login,
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.login = (user as { login?: string }).login ?? "";
      return session;
    },
  },
});
