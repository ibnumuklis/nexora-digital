# NEXORA DIGITAL — Project Status & Handoff

**Brand:** NEXORA DIGITAL — Technology & Product Studio  
**Tagline:** Build. Innovate. Transform.  
**Owner:** Ibnu Muklis  
**Handoff date:** 2026-11-22  
**GitHub repository:** https://github.com/ibnumuklis/nexora-digital.git  
**Supabase project:** `nexora-digital` (`ijkazeukjooauwsvwtiq`)  

## Current truth
This package is a source-code and documentation baseline prepared for takeover by Claude Code. It is not a verified production release. The latest GitHub repository may differ and is authoritative for source code. The live Supabase project has been configured separately and its schema is known to differ from the clean-project SQL migrations in this repository.

## Supabase observations
- Project status reported ACTIVE_HEALTHY, Tokyo region.
- Four migrations were applied during the setup session.
- 23 public tables reported; RLS enabled on inspected business tables.
- Four product categories and five initial product drafts seeded.
- Live RBAC uses `staff_members` and private-schema authorization helpers, not the `user_roles` model expected by the included original migration/code scaffolding.
- A Super Admin record was observed in `staff_members` after setup. Claude must verify current state without exposing unnecessary user data.
- `demo_sessions` has no direct browser-facing policy by design; server-only access is required.
- Security advisor no longer reported the previous externally executable SECURITY DEFINER helper issue; one informational finding about `demo_sessions` remained.

## Phase status (honest assessment)
| Phase | Status | Remaining proof/work |
|---|---|---|
| 0 — Blueprint | Prepared | Claude to compare with latest repository and maintain ADRs |
| 1 — Public UI/UX | Source starter exists | Run lint/typecheck/build/E2E; compare latest GitHub source; finish visual QA |
| 2 — Database/Admin | Live Supabase configured; app integration incomplete | Reconcile schema, SSR Auth, RBAC, CRUD, storage and RLS tests |
| 3 — Integrations | Specs/scaffolding | Real product URLs, SSRF-safe health checks, API/iframe validation |
| 4 — Demo Engine | Spec/scaffolding | Isolated demo runtimes, server enforcement, cleanup, security tests |
| 5 — CRM/Sales | Schema/scaffolding | Complete API, pipeline mutations, quotes, consent and tests |
| 6 — Content Studio | Basic export prototype | Editable editor, provider integration, actual MP4 worker, asset persistence |
| 7 — Analytics/AI | Schema/scaffolding | Consent-aware tracking, real dashboards, evidence-backed recommendations |
| 8 — Production | Not ready | CI, security/performance/accessibility QA, backups, domain, hosting, monitoring, smoke tests and owner approval |

## Known critical issue
See `docs/SUPABASE_LIVE_STATE_AND_RECONCILIATION.md`. Do not blindly apply `supabase/migrations/0001_initial_catalog.sql` or `0002_platform_modules.sql` to the live project. They expect a different schema in several places.

## External/owner dependencies
See `docs/OWNER_INPUT_CHECKLIST.md`. No secret values are included in this handoff. AI/video integrations, domain, hosting, legal text, verified product assets/URLs, and production deployment require owner input/approval.

## Required next action
Claude Code must first inspect the current GitHub repository and live Supabase schema read-only, reconcile discrepancies, then execute the phases in `docs/CLAUDE_HANDOFF_PROMPT.md` on a feature branch with tests and reviewable commits.
