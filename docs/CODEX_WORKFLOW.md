# Codex Workflow — NEXORA DIGITAL

This document defines how the owner, ChatGPT, Codex, GitHub, and Vercel work together. It complements the repository-wide rules in `/AGENTS.md`.

## 1. Roles

- **Owner:** decides product scope, approves business facts, secrets, external services, database changes, merges, and production deployment.
- **ChatGPT Project NEXORA:** helps with product strategy, requirements, architecture, acceptance criteria, task breakdown, and review of outcomes.
- **Codex:** inspects the repository, plans and implements approved code changes, runs tests, explains diffs, and prepares pull requests.
- **GitHub:** source of truth for code, issues, branches, pull requests, and CI results.
- **Vercel:** deploys approved repository states. A successful preview is not production approval.

A conversation in ChatGPT does not automatically share its full history with Codex. Durable project context must live in repository documentation and `AGENTS.md`. Copy only the relevant task brief and acceptance criteria into each Codex task.

## 2. One-time Codex setup

1. Sign in to Codex with the account that has access to GitHub.
2. Connect GitHub and grant Codex access only to `ibnumuklis/nexora-digital` unless another repository is explicitly needed.
3. Create a Codex Cloud environment (web or desktop) and select this repository.
4. Confirm the environment uses the Node version in `.nvmrc` (currently Node 22).
5. Configure the environment install step to install dependencies and test tools. Suggested starting commands:
   ```bash
   npm ci
   sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg
   npx playwright install --with-deps chromium
   ```
   If the environment does not allow `sudo`, use its supported package/tool setup instead. Do not add production secrets to the environment.
6. Use `npm run dev` to start the local development server when a task needs the app running.
7. Confirm Codex reads the root `AGENTS.md` before its first implementation task.

For local Codex CLI/IDE use, clone the same repository, check out a task branch, use Node 22, and follow the same commands and approval gates.

## 3. Standard task lifecycle

### A. Define the task
Every task should state:
- Problem and user/business outcome.
- Exact scope and non-goals.
- Relevant route, module, or files if known.
- Acceptance criteria that can be observed.
- Required tests.
- Whether database, secrets, external services, or deployment are involved.

### B. Inspect before editing
Ask Codex to:
- Read `AGENTS.md` and relevant project docs.
- Inspect current branch, status, recent commits, and existing implementation.
- Trace the full behavior (UI → server action/API → database/policy → tests).
- Report assumptions, unknowns, risks, and a short implementation plan.

For cross-cutting or high-risk work, wait for owner approval of the plan before implementation.

### C. Implement on a task branch
- Use `codex/<ticket-or-short-slug>`.
- Keep the diff focused; do not refactor unrelated modules.
- Add/update tests with the implementation.
- Do not change production settings, database state, credentials, or external integrations.

### D. Verify
Run the narrowest relevant tests first, then the full quality gate:
```bash
npm run lint
npm run typecheck
npm test
npm run build
```

For browser journeys, install Playwright Chromium and run:
```bash
npm run test:e2e
```

For database/RLS changes, do not rely on unit tests alone. Follow the live-schema reconciliation procedure and use the approved SQL/RLS acceptance suite. Production SQL execution requires explicit owner approval.

### E. Open and review a pull request
The PR should include:
- Summary and reason for the change.
- Screenshots or short recordings for UI changes.
- Commands run and exact results (including skips).
- Database/migration impact and whether migrations are additive.
- Security/privacy implications.
- Deployment and rollback notes.

GitHub Actions already runs lint, typecheck, unit tests, production build, Playwright E2E, npm audit, and Gitleaks. Resolve failed checks before asking for merge.

### F. Codex review
After a PR is opened:
1. Request a review by commenting `@codex review`.
2. For sensitive security changes, request `@codex security review` if that feature is available in the connected Codex workspace.
3. Read each finding against the actual diff and relevant code; do not accept a finding blindly.
4. Ask Codex to prepare a narrowly scoped fix when needed.
5. Re-run tests and request another review after changes.

Optional: enable automatic Code Review in Codex settings for this repository. Keep CI as the deterministic enforcement layer; Codex review is an additional reviewer, not a replacement for tests or branch protection.

## 4. Branch and release policy

- Never push directly to `main` for normal feature work.
- Never force-push or reset user work.
- The owner reviews the PR and explicitly approves merge.
- Production deployment requires explicit owner approval, even if Vercel is configured to deploy automatically from `main`.
- Do not merge a PR with failing required checks or unresolved critical security findings.
- Keep preview deployments separate from production.

## 5. NEXORA-specific high-risk areas

### Supabase
Read `docs/SUPABASE_LIVE_STATE_AND_RECONCILIATION.md` first. Live schema and repository migrations have had historical differences. Introspect read-only, compare exact schema and migration history, then propose additive changes. Never reset production or edit an already-applied migration.

### Auth and RBAC
Authorization must be enforced on the server and by database policies. Test anonymous, authenticated non-staff, and each relevant staff role. A hidden button is not a security boundary.

### Demos
Use synthetic data and isolated environments only. The server is authoritative for session token scope, expiry, and idle timeout. Never expose tokens or personal information in a watermark or logs.

### Integrations and uploads
Maintain strict host allowlists and SSRF protections. Validate file type using content/magic bytes, not only the filename or browser MIME declaration.

### Product claims and content
Product copy, pricing, testimonials, case studies, and availability must be verified by the owner. AI-generated content remains draft until approved.

## 6. Current repository quality commands

| Command | Purpose |
|---|---|
| `npm run lint` | ESLint, zero warnings |
| `npm run typecheck` | App and worker TypeScript |
| `npm test` | Vitest unit/integration |
| `npm run build` | Next.js production build |
| `npm run test:e2e` | Playwright browser tests |
| `npm run check` | Lint + typecheck + Vitest + build |

The `npm run check` script does not include Playwright E2E, live Supabase authentication tests, or manual SQL/RLS acceptance testing.

## 7. Initial Codex task

Start with a read-only baseline audit. Do not modify code or database. Report:
1. Current branch, commit, and working-tree status.
2. Project structure and key request/data flows.
3. Existing tests and CI status.
4. Any mismatch between `README.md`, `PROJECT_STATUS.md`, and current code.
5. Security, migration, and deployment risks.
6. The three highest-priority safe engineering tasks, with acceptance criteria.

Only after the owner reviews that report should Codex implement the next task.
