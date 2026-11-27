# NEXORA DIGITAL — Technology & Product Studio

**Build. Innovate. Transform.**

Public product showcase and sales platform with a secure admin console, protected interactive demos, CRM & quotations, an AI Content Studio (PNG/JPG/MP4), and evidence-based marketing analytics. Each linked product stays independently deployed; NEXORA is the hub/control plane.

> The public site runs on Vercel from `main`. Platform stabilization work is tracked on `codex/platform-stabilization`. See `PROJECT_STATUS.md` for release history and open items.

## Stack
Next.js 15 (App Router, Server Actions) · React 19 · TypeScript (strict) · Tailwind CSS · Supabase (Postgres, Auth, Storage, RLS) · zod · Satori/resvg/sharp (images) · FFmpeg worker (video) · Vitest · Playwright + axe · GitHub Actions.

## Quick start
```bash
nvm use            # Node 22
npm ci
cp .env.example .env.local   # set VISITOR_HASH_SALT (openssl rand -hex 24)
npm run dev                  # http://localhost:3000
```
Admin: create an account at `/auth/signup`, confirm the email, then a Super Admin assigns a role in **Admin → Staff**.

## Scripts
| Script | What |
|---|---|
| `npm run lint` | ESLint (flat config, TS rules, 0 warnings) |
| `npm run typecheck` | `tsc` for app and worker |
| `npm test` | Vitest unit/integration (includes real image + MP4 renders; needs ffmpeg) |
| `npm run test:coverage` | Vitest coverage summary and HTML report in `coverage/` |
| `npm run test:e2e` | Playwright (starts `next start`; run `npm run build` first) |
| `npm run build` | Production build |
| `npm run worker` | Render worker (see `docs/RENDER_WORKER.md`) |
| `npm run check` | lint + typecheck + test + build |
| SQL tests | paste `supabase/tests/rls_rpc_test.sql` into the SQL editor → expect `ALL_TESTS_PASSED` |

## Structure
```
src/app/(site)       public website        src/app/admin      admin console (server actions)
src/app/auth         auth flows            src/app/api        public & admin route handlers
src/lib/auth         session, RBAC, password policy
src/lib/content      templates, renderer, copy, storyboard, video
src/lib/security     SSRF guard, upload sniffing
src/lib/demo         demo cookies & synthetic sandbox
supabase/migrations  = applied live migrations (never edit applied files)
supabase/tests       RLS/RPC acceptance suite
worker/              render worker
docs/                ADRs, audit, security, runbook, deployment, specs
```

## Key documents
`docs/adr/README.md` · `docs/SECURITY_PLAN.md` · `docs/SECURITY_FREE_PLAN_LIMITATIONS.md` · `docs/API_DOCUMENTATION.md` · `docs/DEPLOYMENT_GUIDE.md` · `docs/RUNBOOK.md` · `docs/RENDER_WORKER.md` · `docs/OWNER_INPUT_CHECKLIST.md`
