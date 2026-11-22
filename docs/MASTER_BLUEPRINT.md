# NEXORA DIGITAL — Master Blueprint

## 1. Executive summary
NEXORA DIGITAL is a Technology & Product Studio platform that presents, demonstrates, markets, and sells independently developed digital products while providing custom software development services. It combines a public-facing product experience with a secure administration workspace.

The platform is not a monolithic replacement for existing apps. It is a central hub that catalogs and connects independently deployed products while preserving each product's own runtime, data boundary, and release lifecycle.

## 2. Vision and outcomes
- Present products with clear status, value proposition, features, screenshots, and demos.
- Let qualified visitors try controlled interactive demos.
- Convert interest into inquiries, consultations, and sales opportunities.
- Manage product catalog, integrations, media, pricing, leads, and content from one admin area.
- Produce reusable promotional assets and short-form videos.
- Use first-party analytics to identify product interest and content opportunities.

## 3. Brand
- Name: NEXORA DIGITAL
- Descriptor: Technology & Product Studio
- Tagline: Build. Innovate. Transform.
- Visual direction: Deep Forest `#102C25`, Emerald `#16845B`, Lime `#C5F36B`, Off White `#F7F8F5`, Charcoal `#171C1A`, Soft Gray `#E8ECE9`.
- Tone: confident, clear, useful, technically credible; avoid inflated claims.

Name availability, trademarks, domain, and social handles must be checked before public launch.

## 4. Audiences
1. Business owners and operators looking for ready-made software.
2. Schools and education providers looking for learning/administration systems.
3. Marketing teams seeking workflow and CRM solutions.
4. Restaurants and retailers seeking operational systems.
5. Organizations needing custom web applications.
6. Agencies and technology partners interested in white-label/reseller arrangements.

## 5. Business model
- SaaS subscription (monthly/annual).
- One-time license with explicit scope, update, and support terms.
- Custom development projects.
- Maintenance and support retainers.
- White-label and reseller agreements.

Each product may use a different commercial model. Pricing is configurable and must not be invented where not supplied. Custom work uses a request-a-quote workflow.

## 6. Public website sitemap
- `/` Home
- `/products` Explore Products
- `/products/[slug]` Product Detail
- `/demo/[productSlug]` Demo launcher / session entry
- `/solutions` Solutions by industry
- `/pricing` Pricing overview
- `/services/custom-development` Custom Development
- `/partners` Partner & Reseller
- `/insights` Journal listing
- `/insights/[slug]` Article
- `/contact` Contact & Consultation
- `/privacy`, `/terms`, `/cookies` legal pages

## 7. Admin sitemap
- `/admin` Overview
- `/admin/products` Product Management
- `/admin/categories` Categories
- `/admin/demos` Demo Management
- `/admin/integrations` Integration Center
- `/admin/media` Media Library
- `/admin/content-studio` AI Content Studio
- `/admin/content-calendar` Content Calendar
- `/admin/insights` Marketing Intelligence
- `/admin/leads` CRM & Leads
- `/admin/sales` Sales Inquiries & Quotations
- `/admin/pricing` Pricing & Packages
- `/admin/licenses` Licenses
- `/admin/testimonials` Testimonials
- `/admin/articles` Insights CMS
- `/admin/security` Security Center
- `/admin/users` User Management
- `/admin/settings` Settings

## 8. Product inventory seed
The following are initial catalog candidates only. Their live status, ownership, URL, screenshots, and commercial readiness must be verified before publication.

### Waroeng Suramadu ERP
Restaurant operations: POS, products/menu, inventory, suppliers, HPP/planning, customer analytics, cash management, finance, branches, users.

### Marcom Command Center
Marketing operations: campaigns, CRM, branch monitoring, KPIs, budgets, content workflow, and reporting.

### EDU ADMIN
Teacher and school learning-administration workflows, teaching documents, academic planning, and supervision support.

### EDUCLASS
Learning management experience connecting students, teachers, administrators, and parents; learning materials, schedules, tasks, quizzes, results, educational games, attendance/progress, messaging, and payments (payment features only when properly integrated).

### AI Content Repurposing Studio
AI-assisted transformation of source content into multiple publication formats. Capabilities and automation level must be accurately labeled based on what is actually implemented.

## 9. Demo experience
Default policy: 7 minutes per session; configurable between 5 and 10 minutes per product. Idle timeout default 90 seconds; warnings at 60 and 30 seconds. Enforce expiration on the server. Allow policy overrides per product.

Required controls:
- Short-lived, opaque session token.
- Server-side session validation and expiry.
- Isolated demo deployment or isolated tenant/database.
- Synthetic data only.
- Restricted roles and allowed operations.
- Per-session and per-IP/device rate limits as appropriate.
- Automatic reset or disposable environment lifecycle.
- Audit events and abuse monitoring.
- Clear session-expired state and inquiry CTA.

Watermark may display `DEMO VERSION`, NEXORA DIGITAL, session reference, and timestamp. Watermark is deterrence/attribution, not a security boundary. Never claim screenshot or frontend inspection prevention.

## 10. Integration strategy
- Direct URL for independent apps.
- iframe only when target app explicitly permits embedding and security headers are configured accordingly.
- API integration for approved server-to-server capabilities.
- SSO as a later phase using a documented identity protocol and per-app authorization.
- Health checks must be safe, authenticated where required, and avoid exposing internal network resources (SSRF protection).

Each integrated app remains independently deployed and keeps its own production data boundary.

## 11. Sales and CRM
Lead sources include inquiry forms, demo CTAs, consultation requests, and partner forms. Track consent, source, product interest, lifecycle stage, activities, and follow-up. Stages: New, Contacted, Qualified, Negotiation, Proposal Sent, Won, Lost. Provide export with role restrictions and audit trail.

## 12. AI Content Studio
Modules: screenshot/mockup generator, template-based social design editor, carousel builder, copywriting, content calendar, video storyboard and rendering, asset library, export center. Formats include 1080x1350, 1080x1080, 1080x1920, 1200x1200, 1920x1080; video 9:16, 1:1, 16:9 at 15/30/60 seconds.

Separate AI generation from deterministic rendering. Use editable templates and real product assets. Video rendering runs in a background worker/queue; never block normal web requests. Generated text and facts must be reviewed before publishing. Store provider, model, cost estimate, job status, and output asset metadata.

## 13. Analytics and recommendations
Track consent-aware first-party events: page_view, product_view, demo_started, demo_completed, demo_expired, cta_clicked, inquiry_submitted, content_downloaded. Avoid collecting unnecessary personal data. Define event schema and retention. AI recommendations must cite the actual aggregate data they rely on and label creative hypotheses separately.

## 14. Success metrics
- Product page engagement.
- Demo start rate and completion rate.
- Inquiry conversion rate.
- Qualified leads and sales pipeline value.
- Content production throughput and download success.
- Website performance and accessibility.
- Demo abuse rate and security incidents.

Targets should be set after a baseline period; do not invent historical performance.

## 15. Non-functional requirements
- Responsive mobile/tablet/desktop.
- Accessibility and keyboard support.
- Secure-by-default authorization.
- Reliable error/loading/empty states.
- Observability and audit logging.
- Backups and recovery procedures.
- Maintainable modular code.
- Documented migrations and environment variables.

## 16. Out of scope until explicitly approved
- Live payment capture.
- Automatic production deployment.
- Purchase of domains or paid services.
- Importing production customer data into demos.
- Claiming legal ownership or product readiness without verification.
