# NEXORA DIGITAL
## Technology & Product Studio

**Tagline:** Build. Innovate. Transform.

NEXORA DIGITAL is a product showcase, demo experience, sales inquiry, CRM, content studio, and marketing intelligence starter application.

## Current implementation status

This repository now contains a working Next.js application starter with:
- Public landing page, product catalog, product detail, solutions, pricing, insights, and contact pages.
- Search and category filtering for the initial product catalog.
- Demo preview UI with watermark, 7-minute local timer, sample workspace, and clear simulated-data notice.
- Admin dashboard preview with product list, lead pipeline preview, analytics mockup, and a deterministic content caption generator with TXT download.
- Supabase SQL migrations for catalog, leads, demo policies/sessions, integrations, analytics, content operations, and role-based policies.
- Server API route for validated lead submission (requires Supabase environment variables).
- Server API route for demo session creation (requires a published product and enabled demo policy).
- Server API route for basic analytics event collection.

**Important:** This is an implementation starter and local preview, not a deployed production service. Admin pages currently use sample data and are not a production-authenticated console. The browser demo timer is a visual prototype; server session creation is separately scaffolded but not yet wired to a live product proxy or an isolated product environment. Do not connect demo traffic to production databases.

## Stack
- Next.js App Router + TypeScript
- React 19
- Tailwind CSS
- Lucide React
- Supabase PostgreSQL/Auth/Storage (configured through environment variables)

## Run locally

1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
3. Install dependencies: `npm install`.
4. Start development: `npm run dev`.
5. Open `http://localhost:3000`.

The public website and sample demo UI can be previewed without Supabase. Contact form persistence and server demo session creation require a dedicated Supabase project and the environment variables described in `.env.example`.

## Supabase setup

1. Create or select a dedicated development Supabase project.
2. Review `supabase/migrations/0001_initial_catalog.sql` and `0002_platform_modules.sql`.
3. Apply migrations in order using the Supabase SQL editor or CLI.
4. Create a first administrator in Supabase Auth.
5. Assign a role row in `public.user_roles` using a trusted SQL editor / service role, never from the browser.
6. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.
7. Enable a product demo only after an isolated demo target, synthetic data, and server-side access controls have been tested.

## Routes

- `/` — public landing page
- `/products` — product catalog
- `/products/[slug]` — product details
- `/demo/[slug]` — sample demo experience
- `/solutions` — industry solutions
- `/pricing` — engagement models
- `/insights` — editorial preview
- `/contact` — inquiry form
- `/admin` — admin UI preview (sample data; not production-secure)
- `/admin/products` — product management preview
- `/admin/leads` — CRM preview
- `/admin/content` — content caption generator
- `/admin/analytics` — analytics preview

## Before production

Production release is blocked until the following are completed:
- Supabase Auth session handling and server-side RBAC for all `/admin` routes and mutations.
- Persistent CRUD for products, media, pricing, integrations, CRM, and content assets.
- Secure demo proxy / separate demo deployments with server-enforced session validation, expiry, idle timeout, and reset jobs.
- Rate limiting, abuse protection, consent-aware analytics, privacy notice, backups, and security review.
- AI provider integration and a background worker for image/video generation.
- Real product URLs, approved screenshots, pricing, legal terms, and verified content.
- Domain, hosting, deployment secrets, monitoring, and production smoke tests.

See `docs/` for the project blueprint and operational specifications.

## Claude Code handoff
Before continuing development with Claude Code, read `CLAUDE.md` and `docs/CLAUDE_HANDOFF_PROMPT.md`. The live Supabase project has a schema that differs from the original clean-project migrations; see `docs/SUPABASE_LIVE_STATE_AND_RECONCILIATION.md`. Never blindly reapply migrations to the live project.
