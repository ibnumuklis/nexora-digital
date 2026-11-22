# Changelog

## 2026-11-22 — Application starter implementation
- Added Next.js App Router + TypeScript + Tailwind foundation.
- Added public landing, product catalog, product detail, demo preview, solutions, pricing, insights and contact pages.
- Added admin authentication gate using Supabase SSR and staff role checks.
- Added admin overview, catalog, demo, integration, CRM, sales, content, analytics and security preview modules.
- Added product-based caption draft, TXT export, 1080×1350 PNG export and short WebM infographic rendering.
- Added lead submission, analytics event, demo session, heartbeat and session end API scaffolding.
- Added platform SQL migration for CRM, demo, integration, analytics, content, roles, storage and initial product records.
- Updated project status and setup documentation with production blockers.

## 2026-11-22 — Foundation documentation
- Prepared project blueprint, architecture, database design, API spec, UX guideline, security plan and roadmap.


## 2026-11-22 — Supabase integration
- Connected NEXORA to the user-provided Supabase project.
- Applied catalog and core module migrations with RLS.
- Added private-schema authorization helpers and foreign-key indexes.
- Seeded five unpublished product drafts.
- Updated application role lookup to `staff_members` and standardized the publishable-key environment variable.
