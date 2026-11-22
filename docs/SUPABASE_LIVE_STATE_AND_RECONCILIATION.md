# Supabase Live State & Reconciliation — NEXORA DIGITAL

**Prepared:** 2026-11-22  
**Project:** `nexora-digital`  
**Project ref:** `ijkazeukjooauwsvwtiq`  
**Project URL:** `https://ijkazeukjooauwsvwtiq.supabase.co`  
**Region:** Tokyo (`ap-northeast-1`)  
**Observed status:** ACTIVE_HEALTHY  

## Important security note
The Supabase publishable key is intended for browser use when RLS is correctly configured. Never place a Supabase secret/service-role key in client code, Git, this handoff package, or chat. Configure private keys only in local `.env.local` and the hosting provider's encrypted environment settings. If any secret has previously been pasted into a public repository or exposed, rotate it.

## Live-state observations from the connected Supabase project
- Dedicated project named `nexora-digital` exists in the `Nexora Creative Digital` organization.
- Four database migrations were applied during the setup session.
- Twenty-three public tables were reported after setup; RLS was enabled on the business tables inspected.
- Four product categories and five product records were seeded as unpublished drafts.
- The five initial product concepts are Waroeng Suramadu ERP, Marcom Command Center, EDU ADMIN, EDUCLASS, and AI Content Repurposing Studio.
- A `staff_members` role model exists in the live database. A Super Admin row was subsequently verified as present in the connected project.
- Authorization helper functions were moved into a non-exposed `private` schema; the security advisor no longer reported the previous externally executable helper-function finding.
- `demo_sessions` intentionally has no direct browser-facing RLS policy. Session operations must be performed through a properly authenticated server-side service.
- One informational security-advisor finding remained for `demo_sessions` due to no direct RLS policy; this is intentional only if all access is mediated by secure server endpoints.

## CRITICAL: repository migration mismatch
The repository currently contains `supabase/migrations/0001_initial_catalog.sql` and `0002_platform_modules.sql`. They were authored as a clean-project schema and are NOT a reliable description of the already-modified live database.

Known mismatches observed:

| Concern | Repository migration/code expectation | Live database observation |
|---|---|---|
| Staff RBAC table | `public.user_roles` | `public.staff_members` |
| RBAC helper | `public.is_staff(allowed_roles)` | `private.is_nexora_staff()` and `private.has_nexora_role(text[])` |
| Demo token hash | `token_hash` | `session_token_hash` |
| Demo activity | `demo_activity_logs` | Live setup used `demo_sessions` metadata/activity design; inspect exact tables before coding |
| Leads fields | `name`, `interest`, `message`, `marketing_consent` | `full_name`, `need_description`, `consent_marketing` in live setup |
| Content project fields | `project_id`, `generated_copy`, `channel` | Live setup used `content_project_id` on assets and `brief`/`content_type` model |
| Pricing visibility | `is_active` | Live setup used `is_public` |

This table is a warning, not a substitute for a fresh schema inspection. Claude must inspect exact columns, constraints, policies, indexes, functions, triggers, storage buckets, and migration history before modifying anything.

## Required reconciliation workflow
1. Run read-only schema introspection against the connected project.
2. Inspect `supabase_migrations.schema_migrations` or the Supabase migration list and compare it to repository migration files.
3. Inspect exact table columns and RLS policies, including `products`, `product_categories`, `staff_members`, `demo_policies`, `demo_sessions`, `leads`, `sales_inquiries`, `pricing_packages`, `content_projects`, `content_assets`, `analytics_events`, `articles`, `testimonials`, and `audit_logs`.
4. Inspect Storage buckets and policies. Do not assume `nexora-content` exists or is configured correctly.
5. Inspect current admin user UUID/role through a privileged SQL editor without exporting personal information unnecessarily.
6. Map application queries to the live schema. Choose one canonical schema and update code or add safe compatibility views/functions where justified.
7. Create a new additive migration with a new timestamp/version. Never edit already-applied migrations.
8. Test policies with anon, authenticated non-staff, and each staff role. Ensure public users cannot read leads, demo sessions, audit logs, drafts, or private content.
9. Run Supabase security/performance advisors and document accepted findings.
10. Back up before any data migration. No destructive changes without owner approval.

## Safe read-only SQL inspection snippets

```sql
-- Public tables and RLS status
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- Exact public table columns
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

-- Policies
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public','storage')
order by schemaname, tablename, policyname;

-- Functions exposed through public/private schemas
select n.nspname as schema_name, p.proname, pg_get_function_identity_arguments(p.oid) as args,
       p.prosecdef as security_definer
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public','private')
order by 1,2;

-- Storage buckets
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets order by id;
```

## Environment configuration
The repository `.env.example` contains the project URL and a browser-safe publishable key placeholder/value. Confirm the current publishable key in Supabase before local use. Required variables should be validated by the app:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://ijkazeukjooauwsvwtiq.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_CURRENT_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# Server-only; only if a server route genuinely requires service-role access:
SUPABASE_SERVICE_ROLE_KEY=DO_NOT_COMMIT
# Optional integrations, enable only after owner approval:
AI_PROVIDER_API_KEY=DO_NOT_COMMIT
REDIS_URL=DO_NOT_COMMIT
```

Do not add any real secret values to this file. Use `.env.local` and deployment secret manager.

---

## Reconciliation completed — 2026-11-22 (Claude)
- Live inspection showed **5** applied migrations (not 4). All 5 are now stored verbatim in `supabase/migrations/`; the never-applied `0001/0002` files are archived in `supabase/legacy_unapplied/`.
- Three additive migrations were applied with owner approval: `20261122103703_nexora_rbac_audit_hardening`, `20261122104234_nexora_modules_crm_demo_content_analytics`, `20261122114338_nexora_lead_score_search_path`. No table, column or row was dropped; only policies were replaced (tightened).
- Canonical column names used by the code: `staff_members`, `private.is_nexora_staff()/has_nexora_role()`, `session_token_hash`, `full_name`, `need_description`, `consent_marketing` (+ new `privacy_consent`), `duration_minutes`, `is_public`, `content_project_id`. TypeScript types are generated from live: `src/lib/supabase/database.types.ts`.
- RLS/RBAC verified with `supabase/tests/rls_rpc_test.sql` (anon, non-staff, every staff role, service_role) — result `ALL_TESTS_PASSED`, all changes rolled back.
- Storage: `nexora-assets` (private, staff) and new `nexora-public` (public images only, writes by content team).
- See `docs/adr/README.md` and `docs/audit/ACCEPTANCE_REPORT.md`.
