# MASTER HANDOFF PROMPT FOR CLAUDE CODE — NEXORA DIGITAL

You are taking over an existing project, not starting from a blank template. Your task is to audit, reconcile, complete, test, and prepare NEXORA DIGITAL for a controlled production launch. You have access to the user's GitHub repository through your GitHub integration.

## 1. Repository and project identity

- Repository: `https://github.com/ibnumuklis/nexora-digital.git`
- Project name: **NEXORA DIGITAL**
- Brand descriptor: **Technology & Product Studio**
- Tagline: **Build. Innovate. Transform.**
- Owner: Ibnu Muklis
- Product goal: a premium public digital-product showcase and sales platform connected to an admin console, protected interactive demos, CRM/sales, AI Content Studio, and marketing intelligence.
- Supabase project: `nexora-digital`
- Supabase project ref: `ijkazeukjooauwsvwtiq`
- Supabase URL: `https://ijkazeukjooauwsvwtiq.supabase.co`
- Region: Tokyo (`ap-northeast-1`)
- Current local source package is included in this handoff. The remote GitHub repository may be newer or different. **The GitHub repository's current state is authoritative for code.** The connected Supabase project's actual schema is authoritative for live data. Reconcile both; do not assume they match.

## 2. First action: inspect before changing anything

1. Clone/open the repository using the connected GitHub integration.
2. Inspect current branch, remote, working tree, tags, recent commits, open PRs, workflows, deployment config, and repository settings that are visible to you.
3. Preserve all user work. Create a feature branch; do not push directly to `main` unless the owner explicitly asks.
4. Compare repository files with this handoff package. Record differences.
5. Read `CLAUDE.md`, `PROJECT_STATUS.md`, `README.md`, all `docs/`, all SQL migrations, and all route/component files.
6. Run `npm ci` (or the package manager dictated by the lockfile), `npm run lint`, `npx tsc --noEmit`, tests, and `npm run build`. If a script is missing, add it only after understanding the stack. Record actual command outputs and failures.
7. Do not claim a test passed unless it was actually run and passed.

## 3. Existing product and business decisions — do not silently change

### Brand and visual system
- Name: NEXORA DIGITAL.
- Descriptor: Technology & Product Studio.
- Tagline: Build. Innovate. Transform.
- Positioning: digital product studio offering SaaS products, software licenses, custom development, maintenance/support, and white-label/reseller solutions.
- Visual direction: premium, modern, minimalist technology, confident, accessible, enterprise-ready.
- Palette:
  - Deep Forest `#102C25`
  - Emerald `#16845B`
  - Lime Accent `#C5F36B`
  - Off White `#F7F8F5`
  - Charcoal `#171C1A`
  - Soft Gray `#E8ECE9`
- Use polished typography, generous whitespace, restrained motion, accessible contrast, mobile-first layouts, responsive product mockups, skeleton/loading/empty/error states, and consistent light/dark theme behavior.

### Business model
- SaaS subscription.
- Lifetime license.
- Custom development.
- Maintenance/support.
- White-label/reseller.
- Package labels: Starter, Professional, Enterprise, Custom. Do not invent prices. Support contact/request-quote pricing.

### Demo policy
- Default 7 minutes; configurable 5–10 minutes per product.
- Idle timeout default 90 seconds.
- Warning at 60 and 30 seconds.
- One active session per visitor policy by default.
- Server time is authoritative. A client-side timer is presentation only.
- Demo data must be synthetic and isolated from production. Never point a public demo at a production DB.
- Watermark text should identify DEMO VERSION and NEXORA DIGITAL; do not expose bearer tokens, email, IP address, or personal identifiers.
- Watermarks discourage misuse but cannot prevent screenshots, screen recording, browser inspection, or copying of client-delivered assets. Never promise impossible copy protection.

### Initial product records (all remain unverified drafts until owner supplies facts/assets/URLs)
1. Waroeng Suramadu ERP — restaurant operations, POS, products/menu, inventory, suppliers, HPP, customer analytics, petty/cash management, finance, branches, users.
2. Marcom Command Center — marketing operations, campaigns, CRM, branch monitoring, KPI, content workflows, reporting.
3. EDU ADMIN — teacher administration and learning-document workflows.
4. EDUCLASS — LMS/learning ecosystem for students, teachers, administrators, and parents.
5. AI Content Repurposing Studio — AI-assisted repurposing of content into multiple publishing formats.
Do not represent any capability, customer, metric, certification, or availability as fact unless verified by source code or owner-provided materials.

## 4. Required architecture

Preferred baseline (retain compatible existing choices unless there is a strong documented reason):
- Next.js App Router, React, TypeScript.
- Tailwind CSS and accessible reusable components (shadcn/ui where already used).
- Supabase PostgreSQL, Auth, Storage, RLS.
- Vercel or another owner-approved host.
- GitHub Actions CI.
- Server-side integrations and secret management.
- Queue/worker for asynchronous image/video rendering if needed.
- Provider-agnostic AI service interface.

Keep each linked product independently deployed and independently secured. NEXORA is a product hub and integration/control plane, not a forced monolith. Use direct URL, iframe only when the target explicitly permits it, API adapters, and phased SSO. Build SSRF-safe integration checks with strict host allowlists; never accept arbitrary URLs from untrusted users for server-side fetches.

## 5. Critical Supabase schema reconciliation

Read `docs/SUPABASE_LIVE_STATE_AND_RECONCILIATION.md` before any database operation.

The Supabase project has already been modified by setup operations. The repository's current migrations were originally authored for a clean schema and are known to diverge from the live schema. Examples include:
- Repo expects `user_roles`; live setup uses `staff_members`.
- Repo expects `public.is_staff(...)`; live setup uses private-schema authorization helpers.
- Repo expects `token_hash`; live setup uses `session_token_hash`.
- Repo and live lead/content/pricing columns differ.

Therefore:
1. Introspect the remote database read-only first.
2. Inspect migration history and exact schema.
3. Map every application query/API to actual live columns.
4. Select a canonical schema and document it.
5. Prefer additive, idempotent migrations and compatibility adapters/views where justified.
6. Never edit already-applied migrations, drop tables, reset the project, or run destructive changes without a verified backup and explicit owner approval.
7. Test RLS using anon, authenticated non-staff, and role-specific users.
8. Verify private storage buckets and policies; do not assume a bucket exists.
9. Do not expose the service-role key. Use server-only environment variables only when strictly necessary.
10. Confirm the existing Super Admin record; do not create duplicate admin users or print personal user data.

## 6. Complete product scope

### Public website
- Home/landing page with high-impact hero, featured products, value proposition, product categories, solutions, services, proof/case studies, testimonials (only verified), insights, and strong CTA.
- Product catalog with search, categories, filters, sorting, featured and availability states.
- Product detail pages with problem, audience, benefits, features, screenshots, demo video, verified technology stack, pricing model, FAQ, CTA, and related products.
- Solutions/industry pages.
- Pricing and engagement models.
- Insights/journal CMS.
- Contact, consultation, quote, and custom-development forms.
- Privacy policy, terms, cookie/analytics preferences, and demo disclaimer.

### Admin console
- Overview.
- Product/category/features/media management.
- Product integrations and health.
- Demo policies/sessions/audit.
- Leads/CRM/pipeline/activities/follow-up.
- Sales inquiries/quotes/pricing/license records.
- Content projects/assets/templates/calendar.
- Analytics and evidence-backed recommendations.
- Articles/testimonials/SEO.
- Staff/users/roles/settings/security logs.
- RBAC by role and least privilege.

### Product integration center
- Registry for direct URL, approved iframe, API, and phased SSO.
- Status, last checked, health result, integration logs.
- Strict allowlist and SSRF protection.
- Never display a connected status until a real health check has succeeded.

### Protected demo engine
- Server-created opaque session credentials; store hashes where possible.
- Server-side expiry and idle timeout.
- Product/session scope validation on every protected request.
- Rate limiting and abuse protection.
- Synthetic data, isolated tenant/runtime/database.
- Disallow admin, billing, secrets, destructive operations, and sensitive exports by default.
- Cleanup/reseed worker and audit events.
- Friendly capacity, offline, expired, revoked, and network-error states.

### CRM and sales
- Lead capture from contact, product inquiry, demo CTA, quote, consultation, partner requests.
- Fields for contact, company, industry, product interest, source, need, stage, owner, next follow-up, privacy consent, optional marketing consent.
- Lifecycle: New → Contacted → Qualified → Negotiation → Proposal Sent → Won/Lost.
- Activity timeline, quote workflow, export controls, transparent rule-based lead prioritization.
- No outbound email/WhatsApp or payment processing without explicit owner authorization and consent-aware integrations.

### AI Content Studio
- Product-to-content workflow.
- Copy/caption generator with platform/tone/objective/audience.
- Screenshot/mockup generator.
- Editable template-based post and carousel editor.
- Formats: 1080x1350, 1080x1080, 1080x1920, 1200x1200, 1920x1080.
- Storyboard and video infographic generation (15/30/60 seconds; 9:16, 1:1, 16:9).
- PNG/JPG/PDF/MP4 exports where implemented.
- Async rendering jobs, progress, retry, cancellation, cost tracking, asset library, download verification.
- Use Remotion/FFmpeg worker or equivalent; don't fake MP4 with a renamed WebM.
- AI content is draft until approved. Never invent product facts, testimonials, performance metrics, or claims.

### Analytics and marketing intelligence
- Consent-aware event collection.
- Visitors, product views, demo starts/completions, CTA clicks, leads, funnel, channel, and product performance.
- Recommendations must cite the supporting data and show low-data/insufficient-evidence states.
- Clearly separate measured facts from AI hypotheses.

## 7. Implementation sequence and gates

### Gate 0 — Repository + infrastructure audit
Deliver: repo audit, dependency/build status, Supabase live schema report, migration reconciliation plan, architecture decision record, risk register.
Exit: no destructive action; all discrepancies documented.

### Gate 1 — Working foundation and public UX
Deliver: polished responsive public website, route coverage, accessibility basics, metadata/SEO, real database-backed public catalog, working forms and error states.
Exit: lint, typecheck, unit/integration tests, production build pass.

### Gate 2 — Secure admin and database
Deliver: SSR Auth, RBAC, protected routes and APIs, category/product/features/media/pricing CRUD, RLS, audit log, private storage.
Exit: anon/non-staff/staff authorization tests pass; no client-side secret.

### Gate 3 — Integrations and demo engine
Deliver: safe integration registry, real health checks, server-enforced demo sessions, isolation, watermark, idle/expiry, cleanup.
Exit: tampering with browser clock cannot extend session; expired sessions rejected; cross-session and production-data access tests pass.

### Gate 4 — CRM and sales
Deliver: validated forms, CRM pipeline, activities, quote workflow, follow-up and consent controls.
Exit: public users cannot read or enumerate leads; role permissions tested.

### Gate 5 — Content Studio
Deliver: editable template-based PNG/JPG outputs, copy generation interface, asset library, real MP4 rendering worker, job management.
Exit: real output files verified by MIME, dimensions, duration and playback; no fake download buttons.

### Gate 6 — Analytics and intelligence
Deliver: event tracking, dashboards, funnel, recommendations with evidence and privacy controls.
Exit: metrics reconcile with raw events; synthetic/sample data clearly labelled.

### Gate 7 — Production readiness
Deliver: CI, automated tests, security review, dependency scanning, performance/accessibility/SEO QA, backups/restore, monitoring, incident runbook, deployment instructions, smoke tests.
Exit: all checks pass and owner explicitly approves production deployment.

## 8. Quality and engineering requirements

- Strict TypeScript; no broad `any` without documented justification.
- Zod or equivalent server validation for all untrusted input.
- Centralized Supabase clients: browser-safe client and server-only client separated.
- Every admin API must authenticate and authorize on the server.
- RLS on every exposed table; explicit grants and policies.
- No broad grants or permissive policies that leak customer data.
- No arbitrary dynamic URL fetch from user input.
- CSRF protections where applicable, secure cookies, CSP/HSTS/security headers in production.
- Rate limit public forms, analytics and demo creation.
- File upload MIME/size checks and private-by-default storage.
- Loading, empty, success, validation, offline, and error states.
- Accessibility: keyboard operation, visible focus, semantic HTML, contrast, reduced motion.
- SEO metadata, sitemap, robots, canonical URLs, structured data where accurate.
- Unit tests, integration tests, authorization/RLS tests, and browser E2E for critical journeys.
- Keep secrets out of Git; run secret scanning.
- Keep changelog, README, deployment docs, API docs, ERD, runbooks, and `PROJECT_STATUS.md` current.

## 9. Git workflow

- Work in a feature branch; no force push.
- Small, reviewable commits with clear messages.
- Run checks before committing.
- Open a pull request with summary, test evidence, migration impact, screenshots for UI, risks, and rollback plan.
- Do not merge or deploy production without owner approval.

## 10. Owner inputs and external dependencies

Do not block all independent work while waiting for these. Build provider-agnostic interfaces and mark features disabled until approved.

Required eventually:
- Owner's verified production URL/domain and hosting choice.
- Real verified URLs and demo URLs for each app.
- Approved product descriptions, feature lists, logos, screenshots, videos, pricing, licensing and readiness status.
- Confirmation of legal entity/contact details, privacy policy, terms, cookie/analytics policy, demo disclaimer.
- AI provider choice and budget approval.
- Video rendering worker hosting and budget approval.
- Optional Redis/rate-limit provider.
- Payment gateway merchant setup only if online payments are later enabled.
- Customer testimonials/case studies only with permission and evidence.

## 11. What to do now

Start now. Do not ask the owner to restate this brief.

First return a concise audit report based on actual repository and Supabase inspection. Then immediately continue implementing the highest-priority safe work in sequence. Ask the owner only when an irreversible action, paid service, missing legal/business fact, production secret, product fact, or explicit production approval is required. If blocked, complete independent tasks and leave a precise checklist.

At the end of each phase, report:
- what changed (files/modules/migrations/commits),
- exact tests/commands and results,
- verified versus unverified behavior,
- known issues and risks,
- next phase,
- owner inputs required.

Never state “finished”, “deployed”, “secure”, or “production-ready” without evidence. Continue until every safe and owner-authorized phase is complete.
