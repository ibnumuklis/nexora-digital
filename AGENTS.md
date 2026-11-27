# NEXORA DIGITAL — Codex Instructions

These instructions apply to the entire repository. Follow them before making changes.

## Project context

NEXORA DIGITAL is a Next.js product hub and control plane for independently deployed digital products. It includes a public website, product catalog, admin console, protected demos, CRM/quotations, content tooling, and analytics. Do not turn the hub into a monolith that owns each product's production database.

Before a task, inspect the current branch, working tree, recent commits, and relevant files. Read:
- `README.md` and `PROJECT_STATUS.md` (check their dates; verify time-sensitive claims).
- `CLAUDE.md` for existing project-specific conventions where relevant.
- Relevant architecture, ADR, security, deployment, runbook, product-spec, and audit documents under `docs/`.
- `docs/SUPABASE_LIVE_STATE_AND_RECONCILIATION.md` before any database or migration work.

The current repository state is authoritative for code. The actual connected Supabase schema is authoritative for live data. Documentation can become stale; verify before acting.

## Stack and commands

- Next.js 15 App Router, React 19, TypeScript strict, Tailwind CSS.
- Supabase PostgreSQL, Auth, Storage, and Row Level Security (RLS).
- Vitest for unit/integration tests; Playwright and axe for browser/accessibility tests.
- FFmpeg is required by media-render tests and the rendering worker.
- Node version is pinned in `.nvmrc` (currently Node 22); use `npm ci`.

Useful commands:
- `npm run lint`
- `npm run typecheck` (checks app and worker)
- `npm test`
- `npm run build`
- `npm run test:e2e` (requires a production build and Playwright browser; live-auth tests also need explicitly configured test secrets)
- `npm run check` (lint + typecheck + unit/integration tests + build; does not replace E2E or live SQL/RLS verification)

Do not claim a command passed unless you ran it and observed success. Report skipped tests and the reason.

## Git and change management

- Work on a dedicated feature branch, preferably `codex/<short-task-name>`; never work directly on `main`.
- Inspect and preserve existing user changes. Never reset, clean, rebase destructively, force-push, or overwrite work to make a task easier.
- Keep diffs focused and commits small. Do not commit or push unless the user asks for that action.
- Prepare a pull request with purpose, scope, test evidence, risks, migration impact, screenshots for UI changes, and rollback notes when asked.
- Never merge a pull request or deploy to production without explicit owner approval.
- Do not change GitHub repository settings, branch protections, Vercel settings, DNS, billing, or external integrations without explicit approval.

## Database and Supabase safety — critical

The Supabase project has been modified directly and its live schema has previously diverged from early repository migrations.

- Start with read-only inspection. Reconcile exact live columns, constraints, policies, functions, triggers, storage buckets, and migration history before proposing a database change.
- Treat `docs/SUPABASE_LIVE_STATE_AND_RECONCILIATION.md` as a warning and starting point, not proof of the current live schema.
- Never edit a migration that may already have been applied. Add a new timestamped, additive, idempotent migration only after reviewing the live diff.
- Never run `supabase db reset`, destructive migrations, production writes, table/column drops, data rewrites, or migration pushes against production without a verified backup and explicit owner approval.
- Do not create duplicate staff or Super Admin records.
- Test RLS with anonymous users, authenticated non-staff users, and each relevant staff role. Never infer that a UI-hidden control is authorization.
- Keep service-role keys server-only. Never place them in browser code, `NEXT_PUBLIC_*` variables, Git, logs, screenshots, issues, or chat.
- Do not ask the owner to paste secrets into a conversation. Use approved local environment files or encrypted secret stores.

## Security, privacy, and product truth

- Treat all browser input, uploaded files, URLs, webhook payloads, and external content as untrusted.
- Validate untrusted input on the server (use the existing Zod patterns).
- Preserve SSR authentication, server-side RBAC, least privilege, RLS, audit logging, rate limits, secure cookies, CSP/security headers, and SSRF protections.
- Never fetch arbitrary user-supplied URLs from the server. Respect verified host allowlists and block private/internal network destinations.
- Public demos must use synthetic data and isolated environments; never connect a demo to a production database. Server time must enforce expiry and idle timeout.
- Keep AI/provider credentials server-side. Do not enable paid providers, outbound messaging, payment processing, or new external services without owner approval.
- Do not invent product capabilities, prices, customers, testimonials, certifications, performance metrics, legal claims, or readiness status. Use verified source code or owner-approved facts.
- Preserve consent and data-minimization behavior for analytics and CRM.

## Implementation standards

- Prefer small, compatible changes over rewrites. Preserve existing architecture unless a documented decision justifies a change.
- Keep TypeScript strict. Avoid broad `any`; validate external data at boundaries.
- Provide loading, empty, success, validation, and error states for user-facing flows.
- Maintain mobile responsiveness, keyboard accessibility, visible focus, semantic HTML, contrast, and reduced-motion support.
- Add or update tests for behavior, authorization, edge cases, and regressions.
- Update relevant docs, `PROJECT_STATUS.md`, and `CHANGELOG.md` when a change materially affects behavior, operations, security, or project status.

## Definition of done

A change is complete only when:
1. The requested behavior is implemented within the agreed scope.
2. Server-side validation and authorization are correct where applicable.
3. Relevant tests are added or updated and actually run.
4. Lint, typecheck, tests, and build pass, or failures/skips are clearly documented.
5. Security, privacy, migration, and deployment impact are described.
6. Documentation is updated where needed.

For cross-cutting work (auth, RBAC, database, demos, integrations, security, deployment), first return a concise plan, risks, unknowns, and verification steps. Do not perform irreversible or production actions without explicit approval.

## Code Review Rules

Prioritize actionable P0/P1 issues. Specifically inspect:
- Cross-tenant or cross-session data exposure; missing or bypassable RLS/RBAC.
- Service-role or other secrets exposed to client bundles, logs, or artifacts.
- Unsafe URL fetching, SSRF, upload validation bypass, or webhook trust failures.
- Demo access to production data, client-controlled expiry, or token leakage.
- Destructive or non-additive database migrations and schema assumptions that conflict with live Supabase.
- Unverified product claims, prices, testimonials, or analytics presented as measured facts.
- Missing tests for security boundaries or critical business flows.

Do not report style preferences, speculative concerns without a concrete path, or issues already prevented by a verified control. Mechanical formatting and lint checks belong in CI.
