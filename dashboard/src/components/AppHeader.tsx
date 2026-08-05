import Link from "next/link";
import Image from "next/image";
import { auth, signIn, signOut } from "@/auth";
import { ShieldScanIcon } from "./icons";

export default async function AppHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 border-b border-nav-border bg-nav-bg">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <ShieldScanIcon className="h-5 w-5 text-brand" />
            <span className="font-display text-sm font-extrabold uppercase tracking-tight text-nav-ink">
              DPDP AI Scanner
            </span>
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link href="/guide" className="text-sm font-medium text-nav-ink/70 hover:text-nav-ink">
              Guide
            </Link>
            {session?.user && (
              <Link href="/repos" className="text-sm font-medium text-nav-ink/70 hover:text-nav-ink">
                Dashboard
              </Link>
            )}
          </nav>
        </div>

        {session?.user ? (
          <div className="flex items-center gap-3">
            {session.user.image && (
              <Image
                src={session.user.image}
                alt=""
                width={24}
                height={24}
                className="rounded-full"
              />
            )}
            <span className="hidden text-sm text-nav-ink/70 sm:inline">{session.user.login}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-sm font-medium text-nav-ink/70 hover:text-nav-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/repos" });
            }}
          >
            <button type="submit" className="btn btn-primary text-sm">
              Sign in
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
