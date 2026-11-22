# API documentation — NEXORA DIGITAL

All endpoints are same-origin Next.js route handlers (Node runtime). State-changing public endpoints reject cross-origin requests (`Origin` check → 403). Bodies are size-limited and validated with zod. Database functions re-validate everything (defence in depth).

## Public HTTP endpoints
| Method & path | Purpose | Notes |
|---|---|---|
| `POST /api/inquiries` | Contact / quote / consultation / custom development / partner forms | Body: `full_name, email, phone?, company?, industry?, product_slug?, inquiry_type, source, message, budget_range?, timeline?, privacy_consent: true, marketing_consent?, website (honeypot)`. App limit 5 / 10 min / IP; DB limits 3/h/email, 5/h/visitor, 300/h global. Responses: `200 {ok}`, `400 {error, fieldErrors}`, `429`, `503`. Never returns record ids. |
| `POST /api/events` | Consent-aware analytics | Only accepted when cookie `nx_consent=analytics`; otherwise `204` and nothing stored. Allowlisted events; query strings stripped. |
| `POST /api/demo/session` | Start demo `{slug}` | Requires published product with demo enabled. Sets HttpOnly `nx_demo` cookie (token never exposed to JS). Errors: `404 unavailable`, `409 active_session`, `429 rate_limited`, `503 capacity`/`not_configured`. |
| `POST /api/demo/heartbeat` | Validate session `{activity: boolean}` | Server time authoritative; `410` when expired/idle/revoked. |
| `POST /api/demo/end` | End session | Idempotent. |
| `GET /api/demo/sandbox?product=&module=m0..m7` | Synthetic sandbox data | Re-validates session + product scope on every request. |
| `GET /auth/callback` | Email confirmation, magic link, recovery | Supports `?code=` (PKCE) and `?token_hash=&type=`. Same-site `next` only. |

## Admin HTTP endpoints (authenticated + role-checked on the server; RLS applies)
| Method & path | Permission | Notes |
|---|---|---|
| `GET /api/admin/leads/export?status=&mine=` | `crm.export` (super_admin, admin, sales_manager) | CSV (formula-injection safe), audited as `lead_export`. |
| `GET /api/admin/content/preview?project=&format=` | `content.read` | PNG preview rendered by the export engine. |
| `GET /api/admin/assets/:id` | `content.read` | 302 to a 60-second signed URL only if the asset is `ready` and the file exists. |

Admin mutations use **Server Actions** (`src/app/admin/**/actions.ts`) wrapped by `runAction(permission, zodSchema, …)`.

## Database RPC (PostgREST)
| Function | Callable by | Purpose |
|---|---|---|
| `submit_inquiry(p jsonb)` | anon, authenticated | Only public write path into `leads` / `sales_inquiries`. Dedupes open leads by email (90 days), rule-based score with reasons. |
| `track_event(...)` | anon, authenticated | Only public write path into `analytics_events` (demo_* events cannot be forged). |
| `demo_start / demo_heartbeat / demo_end` | anon, authenticated | Demo lifecycle with hashed tokens, capacity and rate limits. |
| `demo_admin_revoke(uuid)`, `demo_cleanup(int)` | admins (checked inside) | Monitoring & retention. |
| `analytics_overview(int)` | authenticated (SECURITY INVOKER → RLS) | Dashboard aggregates. |
| `staff_directory()`, `grant_staff_role(email, role)` | admins / super_admin (checked inside) | Staff management. |
| `log_audit_event(...)` | staff | Explicit audit entries (exports, erasures, evidence). |
| `claim_render_job`, `update_render_progress`, `complete_render_job`, `fail_render_job` | service_role only | Render worker. |
