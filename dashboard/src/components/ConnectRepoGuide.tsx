import { ChevronRightIcon } from "./icons";

const STEPS = [
  {
    title: "Connect the repo",
    body: "Click \"Connect\" next to a repo below. The dashboard re-verifies your GitHub access and generates a one-time API key for that repo.",
  },
  {
    title: "Add the secret",
    body: "Click \"Add secret to GitHub automatically\" — this stores the key as DPDP_DASHBOARD_API_KEY in the repo's Actions secrets for you. If you're not an admin on the repo, add it manually instead (instructions are shown alongside the key).",
  },
  {
    title: "Wire up the Action",
    body: "Paste the workflow snippet shown into a .github/workflows/*.yml file in that repo, referencing dashboard-url and dashboard-api-key.",
  },
  {
    title: "Push or open a PR",
    body: "The scan runs in CI automatically. Results land here within seconds of the workflow finishing — no manual upload.",
  },
];

export default function ConnectRepoGuide({ defaultOpen }: { defaultOpen: boolean }) {
  return (
    <details open={defaultOpen} className="card animate-in group mt-8">
      <summary className="flex cursor-pointer list-none items-center justify-between p-6 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="chip">How it works</p>
          <h2 className="font-display mt-3 text-lg font-extrabold uppercase tracking-tight text-ink">
            Connect a repo in 4 steps
          </h2>
        </div>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-open:rotate-90" />
      </summary>
      <ol className="space-y-4 px-6 pb-6">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="font-display flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{step.title}</p>
              <p className="mt-0.5 text-sm leading-6 text-ink-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </details>
  );
}
