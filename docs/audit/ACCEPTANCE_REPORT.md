# Acceptance report — Gates 0–7

**Date:** 2026-11-22 · **Branch:** `claude/nexora-production-readiness` · Evidence = commands actually run in this session.

Legend: ✅ verified by test/command · 🟡 implemented, partially verified (reason given) · ⛔ blocked on owner input/approval.

## Commands (final run)
| Command | Result |
|---|---|
| `npm ci` / `npm audit` | 0 vulnerabilities |
| `npm run lint` (eslint, `--max-warnings=0`) | pass |
| `npm run typecheck` (app + worker tsconfig) | pass |
| `npm test` (vitest) | 58/58 pass — includes real PNG/JPG renders at all 5 sizes and a real 15 s H.264 MP4 render probed with ffprobe |
| `npm run build` (Next 15.5 production) | pass |
| `npx playwright test` (Chrome, against `next start`) | 18 pass, 5 skipped (live-auth suite needs network access to Supabase; see Gate 2) |
| `supabase/tests/rls_rpc_test.sql` on live DB (single rolled-back transaction) | `ALL_TESTS_PASSED` (~60 assertions: anon, non-staff, 5 staff roles, worker) |
| Worker `--local` renders | 9:16 15 s, 1:1 30 s, 16:9 60 s → h264/yuv420p, exact size, duration 15.000/30.000/60.000 s |

## Gate 0 — Audit ✅
Repo/zip diff, baseline failures, live schema introspection, migration history, advisors, ADRs, risk notes: `docs/audit/GATE0_AUDIT_REPORT.md`, `docs/adr/README.md`.

## Gate 1 — Public UX ✅ / ⛔ content
- DB-backed catalog (search, category, availability, sort), detail pages (problem, benefits, features, screenshots, video link, verified stack, pricing/quote, FAQ, related), solutions, pricing (no invented prices), services, partners, insights CMS, contact/quote/consultation forms, legal pages, sitemap/robots/canonical/JSON-LD, light/dark theme, consent banner. ✅ E2E.
- Accessibility: axe (WCAG 2 A/AA) no serious/critical issues on 5 key pages; keyboard skip link, focus rings, reduced motion. ✅
- Mobile: no horizontal overflow on 5 pages, mobile nav works. ✅
- ⛔ Real product content: all 5 products are unverified drafts → public catalog shows an honest empty state until the owner verifies & publishes.

## Gate 2 — Secure admin & database ✅ / 🟡 live auth E2E
- Least-privilege RLS for every table, grants hardened (TRUNCATE removed from anon/authenticated), audit triggers on 15 tables, last-super-admin guard, product publish requires verification. ✅ SQL suite.
- SSR auth (cookie sessions refreshed in middleware, `getUser()` revalidation), role-filtered admin, server-side permission check in every action/route. ✅ unit + E2E (redirects/401/403).
- CRUD: products (details, verification, publication, features, media upload with magic-byte check, pricing, demo policy, delete with slug confirmation), categories, articles, testimonials, staff. 🟡 Built and type-checked; UI flows not exercised end-to-end here because this sandbox's egress proxy blocks `*.supabase.co`. The live-auth Playwright suite (`tests/e2e/auth-live.spec.ts`) covers sign-in, wrong password, unconfirmed email, non-staff denial, RBAC on direct URLs, password change policy, sign-out and reset request — it runs in CI once `E2E_SUPABASE_URL` + `E2E_SUPABASE_SERVICE_ROLE_KEY` secrets are added, or here if the owner allows the domain.
- Password policy ≥ 12 (app-level) ✅ unit + E2E. Email confirmation required (owner setting) — verified indirectly: unconfirmed-login path implemented & covered in live suite.

## Gate 3 — Integrations & demo engine ✅ / ⛔ targets
- SSRF-safe health checks (https, allowlist, IP-literal block, DNS + connect-time private-address block, no redirects, timeout, logs; "healthy" only after a real check, DB constraint). ✅ unit; network smoke confirmed blocking paths.
- Demo engine: tokens generated & hashed in DB, server time expiry and idle timeout, one session per visitor, capacity, rate limits, cross-session isolation, revoke, cleanup, events, synthetic sandbox validated per request, watermark with session ref & timestamp (no PII). ✅ SQL suite (expiry, idle, wrong token, cross-session, one-per-visitor, draft product refused) + unit.
- ⛔ No product is published/verified and no isolated demo deployment URL exists → no live demo can be enabled yet (by design).

## Gate 4 — CRM & sales ✅
Inquiry RPC with consent, dedupe, transparent score; pipeline New→…→Won/Lost with automatic timeline, activities, follow-ups, owner, lost reason; quotation workflow with admin-only approval and "sent requires approved" enforced by trigger; audited CSV export; erasure. ✅ SQL suite + unit. No outbound email/WhatsApp/payment.

## Gate 5 — Content Studio ✅ / ⛔ AI & worker hosting
Rules-based copy from verified facts (warnings, sources, platform limits, EN/ID), editable templates, preview, PNG/JPG export verified by magic bytes + dimensions + checksum, asset library with signed downloads, approval workflow (editor cannot approve; DB trigger), calendar for approved content only, async MP4 jobs with progress/cancel/retry and ffprobe verification. ✅ unit + local worker renders.
⛔ AI provider (owner choice/budget) and a host for the worker (needs service-role key on that host).

## Gate 6 — Analytics ✅ / 🟡 real data
Consent-gated first-party events, DB aggregation function, dashboard (KPIs, daily chart, funnel, sources, products), recommendations that cite evidence and separate measured facts from hypotheses, low-data state below 50 sessions. ✅ unit + SQL. 🟡 No real traffic yet.

## Gate 7 — Production readiness 🟡 / ⛔
Done: CI workflow (lint, types, tests, build, audit, E2E, gitleaks), security headers + nonce CSP, runbook (backup/restore, incidents, rotation), deployment guide, Free-plan limitations, API docs.
⛔ Hosting, domain, legal approval, verified products, worker host, monitoring provider, production approval.
