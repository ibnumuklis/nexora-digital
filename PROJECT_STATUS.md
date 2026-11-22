# NEXORA DIGITAL — Project Status

**Brand:** NEXORA DIGITAL — Technology & Product Studio · *Build. Innovate. Transform.*
**Owner:** Ibnu Muklis · **Repo:** `ibnumuklis/nexora-digital` · **Supabase:** `nexora-digital` (`ijkazeukjooauwsvwtiq`, Tokyo, Free Plan)
**Updated:** 2026-11-22 · **Branch:** `claude/nexora-production-readiness` (PR open, not merged, **not deployed**)

## Current truth
The application is functionally complete for every module in the brief and passes lint, typecheck, 58 unit tests, production build, 18 browser E2E tests and a ~60-assertion RLS/RPC suite on the live database. It is **not production-ready** until the owner inputs below are provided and production deployment is approved. Evidence: `docs/audit/ACCEPTANCE_REPORT.md`.

## Database
- Live schema is canonical (ADR-001). 8 migrations in `supabase/migrations/` = exactly the 8 applied on live (3 added by Claude: RBAC/audit hardening, modules (CRM/demo/content/analytics), lead_score search_path).
- Live data unchanged except schema: 4 categories, 5 draft products (unverified, no category), 1 Super Admin, 0 leads. All tests rolled back.

## Phase status
| Phase | Status | Remaining |
|---|---|---|
| 0 Audit & blueprint | ✅ Done | — |
| 1 Public UI/UX | ✅ Built & tested | Real product content (owner) |
| 2 Database & admin | ✅ Built; RLS tested on live | Run live-auth E2E (needs CI secret or allowed domain) |
| 3 Integrations | ✅ Built (SSRF-safe) | Verified product URLs + `INTEGRATION_ALLOWED_HOSTS` |
| 4 Demo engine | ✅ Built & tested in DB | Publish a verified product; isolated demo deployment if iframe mode |
| 5 CRM & sales | ✅ Built & tested | — |
| 6 Content Studio | ✅ PNG/JPG/MP4 verified | AI provider + budget; worker host |
| 7 Analytics & recommendations | ✅ Built & tested | Real traffic |
| 8 Production | 🟡 CI, headers, runbooks done | Hosting, domain, legal approval, monitoring, backups schedule, owner approval |

## Owner inputs required
See `docs/OWNER_INPUT_CHECKLIST.md` (updated). Most urgent:
1. Allow live tests: add GitHub secrets `E2E_SUPABASE_URL` + `E2E_SUPABASE_SERVICE_ROLE_KEY` (or allow `ijkazeukjooauwsvwtiq.supabase.co` for this Claude workspace).
2. Supabase Auth: Site URL + redirect `…/auth/callback`; minimum password length 12; custom SMTP for non-team staff emails.
3. Verify each product (facts, screenshots, URLs) then publish in Admin.
4. Choose hosting (web + render worker) and domain; approve legal texts.

## Known issues / risks
- Duplicate index `idx_leads_owner_fk` (harmless; drop in next maintenance migration).
- Public RPCs callable with the publishable key bypass the Next.js IP limiter (DB limits still apply) — ADR-003.
- Free Plan: no HIBP leaked-password check, limited email sending, no PITR — `docs/SECURITY_FREE_PLAN_LIMITATIONS.md`.
- MFA not yet enforced for admins (TOTP available on Free; owner decision).
