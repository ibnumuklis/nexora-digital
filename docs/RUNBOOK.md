# Operations runbook — NEXORA DIGITAL

## Contacts
Owner / incident lead: Ibnu Muklis · [backup contact and on-call channel to be confirmed by owner]

## Routine
| Task | Frequency | How |
|---|---|---|
| Demo session cleanup | daily (also runs opportunistically on every demo start) | Admin → Demo Sessions → **Run cleanup**, or `select public.demo_cleanup(30);` in SQL editor. Deletes ended sessions older than 30 days and stale rate-limit windows. |
| Backup export (Free Plan) | weekly + before every migration | `pg_dump "$DB_URL" --schema=public --schema=private --no-owner -Fc -f nexora-$(date +%F).dump` (connection string from Dashboard → Database, kept outside Git). Export Storage buckets `nexora-assets`, `nexora-public` with the Supabase CLI. Store encrypted, off-site. |
| Restore drill | quarterly | Restore the latest dump into a scratch Supabase project, apply `supabase/migrations/` in order if starting empty, run `supabase/tests/rls_rpc_test.sql` (expect `ALL_TESTS_PASSED`). |
| Advisors | after every migration | `get_advisors` (security + performance) or Dashboard → Advisors. Accepted findings are listed below. |
| Dependency audit | weekly (CI on every PR) | `npm audit --audit-level=high` |
| Analytics retention | monthly | `delete from analytics_events where created_at < now() - interval '13 months';` |

## Accepted advisor findings
- `anon_security_definer_function_executable` / `authenticated_security_definer_function_executable` for `submit_inquiry`, `track_event`, `demo_start`, `demo_heartbeat`, `demo_end`, `demo_admin_revoke`, `demo_cleanup`, `staff_directory`, `grant_staff_role`, `log_audit_event`: intentional narrow APIs (ADR-003). Each validates input and/or role internally; covered by `supabase/tests/rls_rpc_test.sql`.
- `auth_leaked_password_protection`: unavailable on Free Plan (see `SECURITY_FREE_PLAN_LIMITATIONS.md`).
- `unused_index` (INFO): no production traffic yet.
- `duplicate_index` on `leads (idx_leads_owner, idx_leads_owner_fk)`: harmless; drop `idx_leads_owner_fk` in the next maintenance migration (owner approval for DROP INDEX).

## Incident response
1. **Contain**: suspected account compromise → Admin → Staff → set the member *inactive* (takes effect immediately in RLS); ask the user to "Sign out everywhere". Suspected key leak → rotate the key in Supabase (Settings → API) and redeploy.
2. **Demo abuse**: revoke sessions in Admin → Demo Sessions; disable the product's demo policy; lower `max_concurrent_sessions`.
3. **Spam inquiries**: DB limits already apply (3/hour/email, 5/hour/visitor, 300/hour global). Tighten in `public.submit_inquiry` via a new migration if needed.
4. **Investigate**: Admin → Security (audit log), Supabase logs (API, Auth, Postgres).
5. **Recover**: restore from the latest dump if data was modified; re-run RLS test suite.
6. **Notify**: affected people/authorities as required by applicable law (UU PDP). Record a post-mortem in `docs/incidents/`.

## Secrets & rotation
- Browser: only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Web server: `VISITOR_HASH_SALT` (rotate yearly; rotation resets visitor rate-limit keys only), `INTEGRATION_ALLOWED_HOSTS`, `DEMO_IFRAME_HOSTS`.
- Worker host only: `SUPABASE_SERVICE_ROLE_KEY`.
- CI only (optional): `E2E_SUPABASE_URL`, `E2E_SUPABASE_SERVICE_ROLE_KEY` (enables live auth E2E). Never print these in logs.

## Monitoring (to configure on the chosen host)
- Uptime check on `/` and `/products` (expect 200).
- Alert on 5xx rate and on `render_jobs` stuck in `processing` > 15 min (`select count(*) from render_jobs where status='processing' and locked_at < now()-interval '15 min'`).
- Error reporting provider: owner to choose (e.g. Sentry); not bundled to avoid unapproved third-party data transfer.
