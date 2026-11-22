# NEXORA DIGITAL — Project Status

**Brand:** NEXORA DIGITAL — Technology & Product Studio · *Build. Innovate. Transform.*
**Owner:** Ibnu Muklis · **Repo:** `ibnumuklis/nexora-digital` · **Supabase:** `nexora-digital` (`ijkazeukjooauwsvwtiq`, Tokyo, Free Plan)
**Updated:** 2026-11-22 · **Release:** `main` (PR #1 merged) · **Live (interim):** https://nexora-digital-jet.vercel.app — Vercel Hobby, functions in `hnd1` (Tokyo, next to Supabase)

## Current truth
The application is functionally complete for every module in the brief and passes lint, typecheck, 58 unit tests, production build, 18 browser E2E tests and a ~60-assertion RLS/RPC suite on the live database. Owner approved release on 2026-11-22; the site is **public on Vercel** with provisional product content, official logos and final legal texts (sole proprietorship, Makassar). Verified live: home, products, demo session start/end with watermark and server timer, admin redirect to staff sign-in. Remaining owner-only steps are listed below. Evidence: `docs/audit/ACCEPTANCE_REPORT.md`.

## Database
- Live schema is canonical (ADR-001). 8 migrations in `supabase/migrations/` = exactly the 8 applied on live (3 added by Claude: RBAC/audit hardening, modules (CRM/demo/content/analytics), lead_score search_path).
- Migration `20261122123507` dropped the duplicate leads owner index (9 migrations total).
- Live data: 4 categories (renamed), 5 products published with **provisional** content (features, 4 packages each, price on request), demo policies (sandbox, 7 min, 90 s idle), 1 article, 1 Super Admin. Seed: `supabase/seed/20261122_provisional_product_content.sql`.

## Phase status
| Phase | Status | Remaining |
|---|---|---|
| 0 Audit & blueprint | ✅ Done | — |
| 1 Public UI/UX | ✅ Live | Owner corrects provisional product content in Admin |
| 2 Database & admin | ✅ Built; RLS tested on live | Run live-auth E2E (needs CI secret or allowed domain) |
| 3 Integrations | ✅ Built (SSRF-safe) | Verified product URLs + `INTEGRATION_ALLOWED_HOSTS` |
| 4 Demo engine | ✅ Live (sandbox mode) | Isolated demo URL only if iframe mode is wanted |
| 5 CRM & sales | ✅ Built & tested | — |
| 6 Content Studio | ✅ PNG/JPG/MP4 verified; MP4 worker runs on GitHub Actions (free) | Add worker secrets; optional AI provider |
| 7 Analytics & recommendations | ✅ Built & tested | Real traffic |
| 8 Production | ✅ Interim live on Vercel; ops workflow (render, cleanup, uptime) | Supabase Auth URLs, SMTP, GitHub secrets, own domain later |

## Owner inputs required
See `docs/OWNER_INPUT_CHECKLIST.md`. Most urgent:
1. Supabase Auth → URL Configuration: Site URL `https://nexora-digital-jet.vercel.app`, redirect `https://nexora-digital-jet.vercel.app/auth/callback` (+ localhost); minimum password length 12.
2. Custom SMTP (Gmail App Password or Resend free) so confirmation/reset emails are reliable.
3. GitHub secrets `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (render worker + cleanup) and variable `SITE_URL` (uptime); optionally `E2E_SUPABASE_*` for live auth tests.
4. Review/correct provisional product content; add screenshots.
5. Later: own domain/hosting (Vercel Hobby is for non-commercial use — move to Pro or own hosting before commercial operation).

## Known issues / risks
- Product content is provisional (owner to verify); product screenshots not yet supplied.
- Contact form on live verified via DB RPC tests; a human submission on production is recommended once SMTP is set.
- Public RPCs callable with the publishable key bypass the Next.js IP limiter (DB limits still apply) — ADR-003.
- Free Plan: no HIBP leaked-password check, limited email sending, no PITR — `docs/SECURITY_FREE_PLAN_LIMITATIONS.md`.
- MFA not yet enforced for admins (TOTP available on Free; owner decision).
