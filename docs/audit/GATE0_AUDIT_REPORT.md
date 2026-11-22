# Gate 0 — Repository & Infrastructure Audit

**Date:** 2026-11-22 · **Auditor:** Claude (Claude Code) · **Branch:** `claude/nexora-production-readiness`

All findings below come from commands actually run in this session.

## 1. Repository
| Item | Observation |
|---|---|
| Remote | `https://github.com/ibnumuklis/nexora-digital` |
| `main` | 1 commit `2fd7a39` "chore: import NEXORA DIGITAL handoff package as baseline" |
| Handoff zip vs repo | `diff -rq` → identical (no differences) |
| Open PRs / workflows / tags | none / none / none |
| Lockfile | none (non-reproducible installs) |
| Tests | none |
| Stack | Next.js 15.5 App Router, React 19, TypeScript 5.9 strict, Tailwind 3.4, `@supabase/ssr` 0.6 |

### Baseline commands (before any change)
| Command | Result |
|---|---|
| `npm install` | OK; `npm audit`: 1 high (postcss bundled in next), 1 moderate |
| `npm run lint` | **FAIL** — 6 × `react/no-unescaped-entities` |
| `npx tsc --noEmit` | **FAIL** — 4 × implicit `any` in `src/lib/supabase/server.ts` |
| `npm run build` | **FAIL** (lint errors) |

### Code findings
- Public site rendered entirely from hardcoded `src/lib/data.ts`, including unverified figures ("20+ capabilities", product statuses) → violates the "no unverified claims" rule.
- `/demo/[slug]` = client-only countdown. Resetting the timer on any key press means the session never expires; browser clock is authoritative.
- Demo/lead/analytics APIs target columns that do not exist in live DB (`token_hash`, `demo_activity_logs`, `name`, `interest`, `message`, `marketing_consent`, `privacy_consent`, `duration_seconds`, `max_active_sessions_per_visitor`, `last_activity_at`).
- Admin pages are static previews; no persistent CRUD UI. `requireStaff` default role list OK but no per-module least privilege.
- No input validation library, no security headers, no rate limiting beyond an in-memory map, `next.config.ts` allows images from **any** host (`hostname: '**'`).
- Content Studio exported WebM via MediaRecorder (not MP4).

## 2. Supabase live project `ijkazeukjooauwsvwtiq`
- Status ACTIVE_HEALTHY, Postgres 17.12, Tokyo.
- **5** applied migrations (docs claimed 4). Copied verbatim into `supabase/migrations/` from `supabase_migrations.schema_migrations`.
- Repo migrations `0001`/`0002` were never applied → moved to `supabase/legacy_unapplied/`.
- 23 public tables, RLS enabled on all. Helpers `private.is_nexora_staff()` / `private.has_nexora_role(text[])` (SECURITY DEFINER, executable by `authenticated` only).
- Data: 4 categories, 5 products (all `draft`, **no category assigned**, 0 features), 5 demo policies (all disabled), 1 `staff_members` row (`super_admin`, active), 1 auth user, 0 leads.
- Storage: private bucket `nexora-assets` (50 MB, png/jpeg/webp/mp4/webm/pdf) with staff policies.

### Security / correctness gaps found
1. No staff write/read policy on `products`, `product_categories`, `product_features`, `product_media` → admin catalog CRUD impossible; drafts invisible to staff.
2. Every staff role (including `content_editor`) can read/modify leads, pricing, licenses, demo policies, integrations → not least privilege.
3. `audit_logs` has no insert path; no `updated_at` triggers.
4. `leads` lacks privacy-consent, owner, next follow-up, updated_at, score columns.
5. `authenticated` holds table grants on `demo_sessions` (blocked only by RLS; no defence in depth).
6. Analytics accepts any `event_name` (1–80 chars).
7. Advisor WARN: leaked-password protection disabled (dashboard setting — owner action).
8. Advisor WARN: 6 multiple-permissive-policy findings (performance).

## 3. Decisions
See `docs/adr/`. Summary: live schema is canonical; reconcile with **additive** migrations; no drops of tables or data; tighten policies (policy replacement only, no data impact).
