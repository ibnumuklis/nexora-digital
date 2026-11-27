# Reusable Codex Prompts — NEXORA DIGITAL

Use these prompts as starting points. Replace bracketed text with the specific task. Codex must follow the repository root `AGENTS.md`.

## 1. Read-only repository audit

```text
Read AGENTS.md, README.md, PROJECT_STATUS.md, and the relevant docs. Inspect the current branch, commit, working tree, recent history, routes, data flows, tests, and CI. Do not edit files, create commits, change settings, or contact external services.

Return:
- verified facts with file paths,
- current architecture and key flows,
- stale or contradictory documentation,
- test commands and results (run only safe local checks),
- security/database/deployment risks,
- unknowns that require owner input,
- a prioritized implementation plan with acceptance criteria.
Do not claim anything is verified unless you inspected evidence.
```

## 2. Implement a feature

```text
Implement: [FEATURE]

User/business outcome:
[OUTCOME]

Scope:
[IN SCOPE]

Non-goals:
[OUT OF SCOPE]

Acceptance criteria:
- [OBSERVABLE CRITERION 1]
- [OBSERVABLE CRITERION 2]
- [TEST/ACCESSIBILITY/SECURITY CRITERION]

First inspect the existing implementation and relevant docs. Summarize the plan and risks before editing if the work crosses auth, RBAC, database, integrations, demos, security, or deployment. Work on a codex/* branch, keep the diff focused, add tests, run the relevant checks, and report exact results. Do not merge or deploy.
```

## 3. Fix a bug

```text
Investigate and fix: [BUG]

Reproduction:
[STEPS]

Expected:
[EXPECTED BEHAVIOR]

Actual:
[ACTUAL BEHAVIOR]

Find the root cause before editing. Add a regression test that fails before the fix and passes after it. Avoid unrelated refactors. Run the relevant tests plus lint/typecheck/build as appropriate. Report files changed, root cause, test evidence, and remaining risks. Do not merge or deploy.
```

## 4. Database or RLS change — approval required

```text
Propose a database change for: [REQUIREMENT]

Do not execute SQL, apply migrations, or change remote data. First read docs/SUPABASE_LIVE_STATE_AND_RECONCILIATION.md and inspect the current schema/migration history using read-only operations only.

Return:
- exact current schema evidence,
- current application queries and policies affected,
- proposed additive/idempotent migration,
- data/backfill implications,
- RLS test matrix (anon, non-staff, each relevant staff role),
- backup and rollback plan,
- risks and owner approvals required.

Wait for explicit owner approval before any production database operation.
```

## 5. Security review

```text
Review [BRANCH/PR/COMMIT] for security and privacy regressions. Do not modify files.

Prioritize concrete exploit paths involving authentication, server-side authorization, RLS, tenant/session isolation, secrets, SSRF, uploads, webhooks, rate limits, demo expiry, audit logs, and personal data. For each finding, provide severity, affected file/line, preconditions, exploit scenario, impact, and a minimal remediation. Separate verified findings from hypotheses. Do not report style issues.
```

## 6. Prepare a pull request

```text
Prepare this branch for review. Inspect the full diff and run all relevant checks. Do not merge or deploy.

Write a PR description with:
- problem and solution,
- scope and notable design choices,
- screenshots for UI changes,
- commands run and exact results,
- database/migration impact,
- security/privacy review,
- known limitations,
- deployment and rollback notes.

Do not claim tests passed unless they were actually run.
```
