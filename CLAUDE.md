# NEXORA DIGITAL — Claude Code Project Instructions

You are the implementation owner for NEXORA DIGITAL. Read `docs/CLAUDE_HANDOFF_PROMPT.md`, `PROJECT_STATUS.md`, `docs/SUPABASE_LIVE_STATE_AND_RECONCILIATION.md`, and all files under `docs/` before changing code.

## Non-negotiable rules
- Work on the existing repository `https://github.com/ibnumuklis/nexora-digital.git`; inspect the current branch, working tree, remotes, and recent commits first. Never overwrite or reset user work.
- Create a feature branch such as `claude/nexora-production-readiness`. Commit in small logical units. Do not force-push. Open a pull request or clearly summarize commits for review.
- Never expose, print, commit, or put secrets in browser code, logs, screenshots, issues, or documentation. Never ask the owner to paste a service-role key into chat. Use local `.env.local` and deployment secret settings.
- Supabase project ref is `ijkazeukjooauwsvwtiq` (`nexora-digital`, Tokyo). The remote database has already been modified. Do NOT blindly re-run local migrations or drop/rename live tables. First introspect the remote schema and reconcile it with repository migrations and application queries.
- The known schema mismatch is documented in `docs/SUPABASE_LIVE_STATE_AND_RECONCILIATION.md`. Treat the live schema as the source of truth until a reviewed additive migration reconciles it.
- Never enable a product's public listing or demo until its factual details, assets, URL, owner approval, and isolated demo target are verified.
- Demo must never connect to a production database. Watermarks are deterrents, not security controls.
- Never mark a feature complete because a page or button exists. Require backend integration and tests.
- No paid service, domain purchase, production deployment, real payment, customer messaging, destructive migration, or production data changes without explicit owner approval.

## Working sequence
1. Audit repository, dependencies, routes, existing tests, GitHub actions, and deployment config.
2. Run install, lint, typecheck, tests, and production build; record actual failures.
3. Inspect Supabase schema, migrations, RLS, storage buckets, functions, and advisors using read-only operations first.
4. Produce a reconciliation plan. Write additive, idempotent migrations only after confirming the diff. Preserve existing data.
5. Finish server-side Supabase Auth, RBAC, product CRUD, lead handling, and admin authorization.
6. Finish public UX and responsive/accessibility QA.
7. Finish integrations and health checks with SSRF-safe allowlists.
8. Finish demo lifecycle with server-enforced expiry, idle timeout, isolation, synthetic data, and cleanup.
9. Finish CRM/sales, then Content Studio, then analytics and evidence-based recommendations.
10. Add CI, tests, observability, backups/restore runbook, deployment instructions, and security review.
11. Update `PROJECT_STATUS.md`, `CHANGELOG.md`, docs, and a phase acceptance report after each milestone.

## Definition of done
A feature is done only when: UI, server behavior, database policy, error/loading/empty states, validation, authorization, automated tests, and documentation are complete. Build and tests must pass in the repository environment. Production readiness additionally requires owner-provided credentials/secrets, verified product URLs/assets, approved legal/privacy text, isolated demo deployments, and explicit deployment approval.
