# Architecture Decision Records

## ADR-001 — Live Supabase schema is canonical
**Context:** Repo migrations `0001/0002` were never applied and diverge from the live DB.
**Decision:** The 5 applied migrations were copied verbatim into `supabase/migrations/`. All further changes are new, additive, idempotent migrations with timestamp versions. Legacy files are archived in `supabase/legacy_unapplied/`.
**Consequence:** Application code is rewritten against live column names (`full_name`, `need_description`, `session_token_hash`, `duration_minutes`, `is_public`, `content_project_id`, …). TypeScript types are generated from the live DB (`src/lib/supabase/database.types.ts`).

## ADR-002 — Least-privilege RBAC in RLS
**Decision:** Replace the blanket "Staff manage X" policies with role-scoped policies:

| Module | read | write |
|---|---|---|
| products, categories, features, pricing, integrations, demo policies | all staff | super_admin, admin (media/features also content_editor, marketing_manager) |
| leads, activities, inquiries, subscriptions, licenses | super_admin, admin, sales_manager, marketing_manager (read) | super_admin, admin, sales_manager |
| content projects/assets/templates/calendar, articles, testimonials | super_admin, admin, marketing_manager, content_editor | same |
| analytics events, recommendations | super_admin, admin, marketing_manager, sales_manager | (recommendations) super_admin, admin, marketing_manager |
| audit logs | super_admin, admin | trigger only |
| staff members | all staff (own row) / super_admin (all) | super_admin |

Helpers are wrapped as `(select private.fn())` so Postgres evaluates them once per statement.
Server route handlers re-check the same matrix (`src/lib/auth/rbac.ts`) — defence in depth; RLS remains the final boundary.

## ADR-003 — Public writes go through narrow SECURITY DEFINER RPCs
**Context:** No service-role key is (or should be) present in this repo; owner must not paste it into chat.
**Decision:** Public lead/inquiry submission and the demo session lifecycle are implemented as Postgres functions (`public.submit_inquiry`, `public.demo_start`, `public.demo_heartbeat`, `public.demo_end`) that validate every input, enforce rate limits and capacity using **database server time**, and return only non-sensitive fields. Raw demo tokens are generated in the DB, returned once, and only their SHA-256 hash is stored. Direct anon `INSERT` on `leads`/`sales_inquiries` is revoked so the RPC is the only public write path.
**Trade-off:** Anyone holding the publishable key can call these RPCs directly, bypassing Next.js IP rate limiting. Mitigated by DB-level limits (per email, per visitor hash, global per hour, per-product concurrency caps). The advisor lint "security definer function executable by anon" for these functions is accepted and documented.
The service-role key is optional and only needed by the background render worker / scheduled cleanup if run outside Postgres.

## ADR-004 — Audit logging via triggers
Every insert/update/delete on privileged tables writes `audit_logs` through a SECURITY DEFINER trigger that records `auth.uid()`, table, row id and changed column names (not full values, to avoid copying personal data).

## ADR-005 — Integration health checks are SSRF-safe server actions
Health checks run only on the Next.js server, only for `https` URLs whose host is in `INTEGRATION_ALLOWED_HOSTS` (env), after DNS resolution confirms no private/loopback/link-local address, with no redirects followed, 5s timeout, HEAD/GET only. A status is shown as `healthy` only after a real check succeeds.

## ADR-006 — Content rendering is deterministic; AI is a pluggable, disabled-by-default provider
PNG/JPG are rendered server-side from versioned templates (Satori → PNG via `next/og`, JPG via `sharp`) at exact dimensions. Copy suggestions come from a deterministic template generator using only verified product fields; an AI provider interface exists but is disabled until the owner selects a provider and budget. MP4 is rendered by a separate Node worker (`worker/`) using FFmpeg (H.264, yuv420p) from rendered frames; jobs are queued in `render_jobs`. No fake MP4.

## ADR-007 — Demo isolation
NEXORA never proxies to a production product database. A demo is either (a) the built-in synthetic sandbox rendered by NEXORA from synthetic fixtures, or (b) an owner-approved isolated demo deployment embedded via iframe only when its host is allowlisted. Every sandbox request validates the session server-side; expired sessions receive no sandbox content.

## ADR-008 — Products are hidden until verified
Public pages read only `publication_status = 'published'` rows (RLS). Seeded drafts stay hidden. The public site shows honest empty states until the owner publishes verified products via the admin console.

## ADR-009 — Bahasa Indonesia as primary locale, English as toggle

**Status:** Accepted (owner decision, 2026-11-25)

## Context
The primary market is Indonesia (UMKM, schools, mid-sized companies, agencies). The site was English-only.

## Decision
- Public site defaults to Bahasa Indonesia; visitors can switch to English with an ID/EN toggle stored in the first-party cookie `nx_lang` (1 year). No URL prefixes, so existing URLs and canonical links stay unchanged.
- UI strings live in typed dictionaries `src/lib/i18n/dictionaries/{id,en}.ts` (`en` must match the `id` shape).
- Database content: primary columns hold Bahasa Indonesia; English is stored in an additive `translations jsonb` column (`{"en": {...}}`) on products, product_features, pricing_packages, product_categories and articles. `localized()` in `src/lib/catalog.ts` overlays it for `en`, falling back to the primary text.
- Admin console stays English; admins edit the primary (Indonesian) fields. English overrides are edited via SQL for now.
- WhatsApp is the primary call to action (`waLink()` with a pre-filled message; clicks tracked only with analytics consent).

## Consequences
- Public pages read a cookie and are rendered dynamically (no ISR). Acceptable at current traffic; revisit with `unstable_cache` or locale-prefixed routes if traffic grows.
- Search engines index the Indonesian version (default). An English-indexed version would need locale-prefixed URLs + hreflang later.
