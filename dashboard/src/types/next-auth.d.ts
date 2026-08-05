import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    githubId?: string;
    login?: string;
  }

  interface Session {
    user: {
      id: string;
      login: string;
    } & DefaultSession["user"];
  }
}
