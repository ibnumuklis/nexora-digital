# Implementation Guide

## Local setup

- Node.js 20+ (recommended Node 22 LTS)
- npm 10+
- Supabase project for persistent backend features

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public project settings. `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be committed or exposed through a `NEXT_PUBLIC_` variable.

## Database setup

Apply migrations in order:

1. `supabase/migrations/0001_initial_catalog.sql`
2. `supabase/migrations/0002_platform_modules.sql`

These migrations are intended for a dedicated NEXORA development database. Review SQL before applying. Do not apply to an unrelated production database.

Create an Auth user in Supabase, then assign the role using the SQL editor with the exact Auth user UUID:

```sql
insert into public.user_roles(user_id, role)
values ('YOUR_AUTH_USER_UUID', 'super_admin');
```

Do not expose service-role credentials or allow browser-side role assignment.

## Current demo behaviour

The public `/demo/[slug]` route is a simulated product preview with local timer and watermark. The API routes scaffold a database-backed session lifecycle but the local demo UI is not yet connected to the session token. Live iframe/app proxy integration must be implemented before production. Demo policies default to disabled.

## Current content exports

The Content Studio can create a caption draft, download TXT, rasterize a branded poster to PNG, and render an 8-second animated WebM using browser MediaRecorder. WebM is not MP4. Production MP4 rendering requires a server-side FFmpeg/Remotion worker and job queue.

## Admin security

`/admin` is gated by Supabase Auth and `user_roles`. Every API mutation must also independently verify the authenticated user and staff role. RLS remains the final database boundary. Admin UI preview data is not a replacement for persistent CRUD.

## Before production

- Add distributed rate limiting (Redis/edge service) to public endpoints.
- Add CAPTCHA or equivalent abuse protection where appropriate.
- Complete admin CRUD for all modules.
- Add signed upload URLs and content asset metadata workflows.
- Wire analytics instrumentation with consent and privacy controls.
- Connect demo UI to server heartbeat and enforce expiry at the demo proxy.
- Add demo reset jobs and environment isolation.
- Run automated tests, security review, backup/restore tests and deployment smoke tests.
