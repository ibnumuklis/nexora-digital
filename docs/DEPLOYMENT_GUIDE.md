# Deployment guide

> No production deployment has been performed. Deploying requires explicit owner approval, a chosen host and domain.

## 1. Prerequisites (owner)
- Hosting choice for the web app (recommended: Vercel — Next.js App Router, Node runtime).
- Host for the render worker (container/VM with ffmpeg; see `RENDER_WORKER.md`).
- Domain + DNS access.
- Supabase Auth settings (Dashboard → Authentication → URL configuration):
  - **Site URL**: `https://<production-domain>`
  - **Redirect URLs**: `https://<production-domain>/auth/callback`, plus `http://localhost:3000/auth/callback` for development and preview URLs if used.
  - Providers → Email → **Minimum password length: 12** (recommended, matches app policy).
  - Optional but recommended: custom SMTP (see `SECURITY_FREE_PLAN_LIMITATIONS.md`).
- Email templates: the default templates work with `/auth/callback` (PKCE `?code=`). If you customise templates to the token-hash style, link to `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=<signup|recovery|magiclink>`.

## 2. Environment variables (web app)
| Variable | Scope | Required | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | yes | `https://ijkazeukjooauwsvwtiq.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | yes | `sb_publishable_…` |
| `NEXT_PUBLIC_SITE_URL` | public | yes | canonical origin, e.g. `https://nexora.digital` |
| `VISITOR_HASH_SALT` | server secret | **yes in production** | ≥ 16 random chars (`openssl rand -hex 24`). Without it, demos and inquiry visitor keys fail closed. |
| `INTEGRATION_ALLOWED_HOSTS` | server | for health checks | comma list of verified product apex domains |
| `DEMO_IFRAME_HOSTS` | server | for iframe demos | comma list of isolated demo hosts |
| `AI_PROVIDER_ENABLED`, `AI_PROVIDER`, `AI_PROVIDER_API_KEY` | server secret | no | keep unset until provider & budget approved |

**Never** set `SUPABASE_SERVICE_ROLE_KEY` on the web app — it is not used there.

## 3. Database
All migrations in `supabase/migrations/` are already applied to the live project (versions match file names). For a new environment apply them in order, then run `supabase/tests/rls_rpc_test.sql` (expected final message `ALL_TESTS_PASSED`).

## 4. Deploy (Vercel example)
1. Import the GitHub repository; framework preset Next.js; Node 22.
2. Add the environment variables above for Production (and Preview with a staging Supabase project if available).
3. Deploy a **preview** from the PR branch, run the smoke tests below, then promote only with owner approval.

## 5. Smoke tests after deploy
```bash
E2E_BASE_URL=https://<preview-url> npx playwright test tests/e2e/public.spec.ts tests/e2e/security.spec.ts
```
Manual: sign in as Super Admin → Overview loads → Products list shows the 5 drafts → Security page "Configuration checks" all green.

## 6. Going live checklist
- [ ] Owner approved legal texts (privacy, terms, cookies, demo disclaimer) — remove "Draft" banner in `src/components/site/legal.tsx`.
- [ ] At least one product verified and published via Admin.
- [ ] `VISITOR_HASH_SALT` set; Security page checks green.
- [ ] Custom SMTP configured if staff outside the Supabase team will sign in.
- [ ] Backup export taken (`RUNBOOK.md`).
- [ ] Owner's explicit production approval recorded in the PR.
