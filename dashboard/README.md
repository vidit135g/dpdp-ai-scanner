# DPDP AI Scanner — Dashboard

A web dashboard for [dpdp-ai-scanner](../README.md): sign in with GitHub,
connect repos, and browse scan history and findings without touching the
CLI or reading raw JSON reports. Scan results are pushed here automatically
by the [GitHub Action](../action.yml) after each run.

Next.js (App Router) + Postgres + Auth.js. Self-hostable, no vendor lock-in.

## Screenshots

### Homepage
![Homepage](docs/screenshots/homepage.png)

### Repos dashboard
Aggregate findings across every connected repo, a collapsible step-by-step
connect guide, and a bulk "Connect all" action.
![Repos dashboard](docs/screenshots/repos-dashboard.png)

### Scan detail — Technical view
File:line, call source, payload args, and dataflow reasoning per finding.
![Scan detail, technical view](docs/screenshots/scan-detail-technical.png)

### Scan detail — Compliance view
The same findings regrouped by DPDP obligation, remediation text upfront,
code de-emphasized behind a disclosure — built for a non-engineering reader.
![Scan detail, compliance view](docs/screenshots/scan-detail-compliance.png)

### DPDP Act guide
Public, no-login-required background reading on the DPDP Act itself —
cited, not just asserted.
![Guide index](docs/screenshots/guide-index.png)

## How it works

```
GitHub Action (per push/PR)
  → runs the CLI scan
  → POSTs the JSON report to /api/scans (repo-scoped API key)
      ↓
Dashboard (Next.js + Postgres)
  → stores Scan + Finding rows
  → renders scan history, risk trend, technical/compliance views
```

Signed-in users only see repos they actually have GitHub access to —
access is checked live against the GitHub API on every page load, not
cached, so a revoked GitHub permission takes effect immediately.

## Connecting a repo

1. **Connect the repo** — click "Connect" next to a repo on the Repos page.
   The dashboard re-verifies your GitHub access and generates a one-time
   API key for that repo.
2. **Add the secret** — click "Add secret to GitHub automatically". This
   uses the GitHub API to encrypt and store the key as
   `DPDP_DASHBOARD_API_KEY` in that repo's Actions secrets — no manual
   copy-paste. (Requires admin access on the repo; if you're a collaborator
   without admin rights, add the secret manually instead — instructions are
   shown alongside the key.)
3. **Wire up the Action** — paste the workflow snippet shown into a
   `.github/workflows/*.yml` file in that repo:

   ```yaml
   - uses: vidit135g/dpdp-ai-scanner@main
     with:
       dashboard-url: "https://your-dashboard-url"
       dashboard-api-key: ${{ secrets.DPDP_DASHBOARD_API_KEY }}
   ```

4. **Push or open a PR** — the scan runs in CI automatically. Results land
   on the dashboard within seconds of the workflow finishing.

Got a lot of repos? Use **Connect all** at the top of the Repos page to run
steps 1–2 across every accessible repo at once (steps 3–4 still need the
workflow file added per repo — that's a code change to your repo, so it's
never done automatically).

## Local development

### Prerequisites

- Node 20+
- A Postgres database
- A [GitHub OAuth App](https://github.com/settings/developers) — homepage
  URL `http://localhost:3100`, callback URL
  `http://localhost:3100/api/auth/callback/github`

### Setup

```bash
cd dashboard
npm install
```

Create `.env`:

```bash
DATABASE_URL="postgresql://postgres:devpassword@localhost:55432/dpdp_dashboard"
NEXTAUTH_SECRET="generate-a-random-secret"
NEXTAUTH_URL="http://localhost:3100"
GITHUB_CLIENT_ID="your-oauth-app-client-id"
GITHUB_CLIENT_SECRET="your-oauth-app-client-secret"
```

Start a local Postgres (adjust to however you normally run Postgres — this
is one way):

```bash
docker run -d --name dpdp-dashboard-db \
  -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=dpdp_dashboard \
  -p 55432:5432 postgres:16-alpine
```

Apply the schema and start the app:

```bash
npx prisma migrate dev
npm run dev -- -p 3100
```

Visit `http://localhost:3100`.

### Notes

- `npm install` runs `prisma generate` automatically via `postinstall`.
- There's no `docker-compose.yml` yet for a one-command self-hosted stack —
  the app and Postgres are run separately for now. That's a natural next
  step, not yet built.
- The GitHub OAuth scope requested is `repo` (not just `read:user`) — this
  is what lets the dashboard check whether a signed-in user can see a
  *private* repo's scans, and what lets "Add secret automatically" call the
  GitHub Actions secrets API. It's a broad grant; see the comment in
  [`src/auth.ts`](src/auth.ts) for the tradeoff.

## Project structure

```
dashboard/
  prisma/schema.prisma       # User/Account/Session, Repo, ApiKey, Scan, Finding
  src/app/
    page.tsx                 # Public marketing homepage
    guide/                   # Public DPDP Act guide (no login)
    repos/                   # Authenticated dashboard
    api/scans/                # Ingestion endpoint the Action POSTs to
    api/repos/                # Connect / rotate-key / auto-add-secret
  src/components/            # RiskDonut, RiskTrendChart, ConnectRepoGuide, etc.
  src/content/guide.ts        # DPDP Act guide article content + sources
```

## Not legal advice

Same caveat as the [CLI scanner](../README.md): this is a triage aid, not
a compliance certification. Findings and the DPDP Act guide should be
reviewed by qualified counsel before being relied on.
