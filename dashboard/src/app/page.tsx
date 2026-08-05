import Link from "next/link";
import { auth, signIn } from "@/auth";
import { GUIDE_ARTICLES } from "@/content/guide";
import ScanLineBackground from "@/components/ScanLineBackground";
import {
  SearchCodeIcon,
  ScaleIcon,
  ShieldScanIcon,
  ChevronRightIcon,
  ArrowUpRightIcon,
} from "@/components/icons";

const STEPS = [
  {
    icon: SearchCodeIcon,
    title: "Discover call sites",
    body: "Static AST scan finds every OpenAI, Anthropic, Azure, Gemini, LangChain, and HuggingFace call in a Python codebase.",
  },
  {
    icon: ScaleIcon,
    title: "Estimate the risk",
    body: "Traces each payload one hop back for PII-flavored names or known incoming-data sources, and rates it HIGH, MEDIUM, or LOW.",
  },
  {
    icon: ShieldScanIcon,
    title: "Map the obligation",
    body: "Every finding is tied to the specific DPDP Act sections it triggers — consent, cross-border transfer, processor agreements.",
  },
];

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <section className="relative overflow-hidden border-b border-border px-6 py-28 sm:py-40">
        <ScanLineBackground />
        <div className="relative mx-auto max-w-3xl">
          <p className="chip animate-in">DPDP Act, 2023 · triage aid, not legal advice</p>
          <h1
            className="animate-in font-display mt-6 text-4xl font-black uppercase leading-[0.95] tracking-tight text-ink sm:text-6xl"
            style={{ animationDelay: "60ms" }}
          >
            Find the code that ships
            <br />
            personal data to an <span className="text-brand">AI vendor</span>
          </h1>
          <p
            className="animate-in mt-6 max-w-xl text-base leading-7 text-ink-muted"
            style={{ animationDelay: "120ms" }}
          >
            An open-source static scanner that walks your Python codebase, flags AI/LLM API
            calls likely carrying personal data, and maps each one to the DPDP Act obligation
            it triggers — before it ships.
          </p>
          <div
            className="animate-in mt-9 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "180ms" }}
          >
            {session?.user ? (
              <Link href="/repos" className="btn btn-primary h-12 px-7 text-sm">
                Go to dashboard
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn("github", { redirectTo: "/repos" });
                }}
              >
                <button type="submit" className="btn btn-primary h-12 px-7 text-sm">
                  Sign in with GitHub
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </form>
            )}
            <Link href="/guide" className="btn btn-secondary h-12 px-7 text-sm">
              Read the DPDP guide
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-canvas px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="chip animate-in">How it works</p>
          <h2 className="font-display mt-4 max-w-lg text-2xl font-extrabold uppercase tracking-tight text-ink">
            Three passes. One triage report.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="card card-interactive animate-in p-6"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-soft">
                  <step.icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="font-display mt-5 text-sm font-bold uppercase tracking-wide text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="chip animate-in">DPDP Act guide</p>
              <h2 className="font-display mt-4 text-2xl font-extrabold uppercase tracking-tight text-ink">
                Know the law you&apos;re scanning against
              </h2>
            </div>
            <Link
              href="/guide"
              className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:underline sm:flex"
            >
              View all
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {GUIDE_ARTICLES.slice(0, 3).map((article, i) => (
              <Link
                key={article.slug}
                href={`/guide/${article.slug}`}
                className="card card-interactive animate-in p-5"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <h3 className="font-display text-sm font-bold text-ink">{article.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-muted">{article.dek}</p>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
                  {article.readMinutes} min read
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="mt-auto bg-canvas px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-xs text-ink-faint sm:flex-row">
          <p>dpdp-ai-scanner — open source, self-hostable. Not legal advice.</p>
          <div className="flex items-center gap-4">
            <Link href="/guide" className="hover:text-ink-muted">
              Guide
            </Link>
            <a
              href="https://github.com/vidit135g/dpdp-ai-scanner"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink-muted"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
