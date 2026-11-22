# Development Roadmap

## Phase 0 — Research & Master Blueprint
Deliverables: scope, sitemap, user flows, architecture, ERD, API contracts, UX system, security plan, deployment plan, acceptance criteria.
Exit: owner reviews the blueprint and confirms product facts/domain/hosting assumptions.

## Phase 1 — Foundation & UI/UX
Deliverables: Next.js setup, design tokens, responsive public pages, product catalog/detail, contact forms, reusable components.
Exit: all routes render; navigation/forms states work; lint/typecheck/build pass; responsive and accessibility checks pass.

## Phase 2 — Database & Admin
Deliverables: migrations, Auth, RBAC, RLS, admin shell, product/category/features/media CRUD, audit log.
Exit: CRUD and role tests pass; public access only reads published data; secrets remain server-side.

## Phase 3 — Product Integration
Deliverables: integration registry, direct links, permitted iframe previews, API adapter contracts, health monitoring.
Exit: every integration is verified; URL allowlist and SSRF protections tested.

## Phase 4 — Protected Demo Engine
Deliverables: session policy, server-side expiry, isolated demo deployment, synthetic data, watermark, activity logs, cleanup.
Exit: session expiry cannot be bypassed by editing frontend timer; cross-session/data isolation tests pass.

## Phase 5 — Sales & CRM
Deliverables: packages, inquiries, leads, pipeline, activities, quote workflow, product finder/comparison.
Exit: lead lifecycle and consent are testable; role restrictions and exports verified.

## Phase 6 — AI Content Studio
Deliverables: template-based image/design editor, copywriting, carousel, storyboard, async video render, asset library/export.
Exit: real PNG/JPG/MP4 assets are generated, previewed, and downloadable; failure/cost states handled.

## Phase 7 — Analytics & AI Intelligence
Deliverables: event schema, dashboards, funnel metrics, recommendations with evidence.
Exit: numbers reconcile with source events; low-data states are clearly labeled.

## Phase 8 — Production & Optimization
Deliverables: security/performance/accessibility/SEO QA, monitoring, backup/restore, deployment runbook.
Exit: production environment verified and operational ownership confirmed.

## Working agreement
Each phase produces a demoable increment, test report, updated documentation, and updated `PROJECT_STATUS.md`. Do not mark a phase complete on UI appearance alone.
