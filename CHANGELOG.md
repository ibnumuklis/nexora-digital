# Changelog

## [1.0.0] — 2026-11-22 — Public release (interim hosting)
- Merged PR #1 to `main`; deployed to Vercel production: https://nexora-digital-jet.vercel.app (functions in Tokyo `hnd1`; previews protected by Vercel Authentication, production public).
- Official logos (mark, wordmarks, icons, OG image) across site, admin and render templates.
- Company identity (sole proprietorship, Makassar; email, WhatsApp) and final Privacy (UU PDP), Terms, Cookies and Demo disclaimer.
- Provisional content for all 5 products (features, packages, FAQ, SEO) published; demos enabled in sandbox mode.
- Migration `20261122123507_nexora_drop_duplicate_lead_owner_index` (applied live).
- Free operations: `worker --once` + `.github/workflows/operations.yml` (render queue every 15 min when jobs exist, daily demo cleanup, uptime check).

## [0.2.0] — 2026-11-22 (branch `claude/nexora-production-readiness`, unreleased)

### Database (applied to live, additive)
- `20261122103703_nexora_rbac_audit_hardening`: least-privilege RLS per role, staff policies for the catalog (previously missing), TRUNCATE/TRIGGER/REFERENCES revoked from anon/authenticated, service_role grants, audit triggers, `updated_at` triggers, publish-requires-verification constraint, last-super-admin guard, `staff_directory()`, `log_audit_event()`.
- `20261122104234_nexora_modules_crm_demo_content_analytics`: DB rate limiter; CRM columns (consent, owner, follow-up, score); `submit_inquiry()`; quotation workflow trigger; `track_event()` + event allowlist; `analytics_overview()`; demo engine (`demo_start/heartbeat/end/admin_revoke/cleanup`, `demo_session_events`); integration check log; content approval trigger; `render_jobs` + worker RPCs; public image bucket `nexora-public`; `grant_staff_role()`.
- `20261122114338_nexora_lead_score_search_path`: advisor fix.
- Repo now contains the 5 previously applied migrations verbatim; never-applied legacy SQL archived.

### Application
- Rebuilt public site on live data with honest empty/error states, SEO, JSON-LD, consent-aware analytics, light/dark theme, legal drafts.
- Auth: password + magic link, sign-up with email confirmation, reset, callback (PKCE + token hash), sign-out (local/global), ≥ 12-char password policy.
- Admin console: overview, products, categories, integrations, demo sessions, leads/CRM, sales & quotes, Content Studio, articles, testimonials, analytics, staff, security/audit, account.
- Demo engine UI with server-authoritative timer, warnings at 60/30 s, idle timeout, watermark, synthetic sandbox.
- Content Studio: rules-based copy, editable templates, PNG/JPG export (5 sizes), MP4 worker (H.264, verified), asset library, approvals, calendar.
- Security: nonce CSP, HSTS and headers, same-origin checks, SSRF-safe health checks with DNS-rebinding protection, magic-byte upload checks, CSV formula-injection protection.

### Tooling
- ESLint flat config, vitest (58 tests), Playwright E2E + axe, GitHub Actions CI with gitleaks, `npm audit` 0 vulnerabilities (postcss/fflate overrides).

## [0.1.0] — 2026-11-22
- Handoff baseline imported (did not lint, typecheck or build).
