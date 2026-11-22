# NEXORA DIGITAL — Owner Input Checklist (updated 2026-11-22)

Engineering work that does not depend on these items is complete. Items are ordered by impact.

## A. To finish verification (quick)
- [ ] **Enable live tests** — either add GitHub repository secrets `E2E_SUPABASE_URL` (`https://ijkazeukjooauwsvwtiq.supabase.co`) and `E2E_SUPABASE_SERVICE_ROLE_KEY` (Settings → Secrets → Actions; never paste the key in chat), **or** allow the domain `ijkazeukjooauwsvwtiq.supabase.co` for this Claude workspace (claude.ai → Settings → Capabilities). This runs the live authentication/session/password suite.
- [ ] Supabase Dashboard → Authentication → URL Configuration: Site URL `https://nexora-digital-jet.vercel.app`; Redirect URLs `https://nexora-digital-jet.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`.
- [ ] GitHub → Settings → Secrets and variables → Actions: secrets `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`; variable `SITE_URL=https://nexora-digital-jet.vercel.app` (enables the free render worker, demo cleanup and uptime check).
- [ ] Authentication → Providers → Email → Minimum password length **12**.
- [ ] Custom SMTP (needed to email staff who are not Supabase team members).
- [ ] Decide whether to enforce TOTP MFA for admin roles.

## B. Before public launch
- [x] Interim hosting: Vercel (live). Render worker: GitHub Actions (free, public repo).
- [ ] Own domain (add in Vercel → Domains, then update Supabase Site URL and `NEXT_PUBLIC_SITE_URL`). Move off Vercel Hobby before commercial operation.
- [x] Legal identity and texts applied (sole proprietorship, Makassar). Have a lawyer review when the business grows.
- [x] Official logos applied.
- [ ] Per product (Waroeng Suramadu ERP, Marcom Command Center, EDU ADMIN, EDUCLASS, AI Content Repurposing Studio): approved description, features, audience, stage, pricing model/packages, screenshots, product URL, demo approach (sandbox or isolated demo URL), — currently **provisional** content is published; correct it in Admin → Products.
- [ ] Verified product domains for `INTEGRATION_ALLOWED_HOSTS`; isolated demo hosts for `DEMO_IFRAME_HOSTS`.
- [x] Production deployment approved (2026-11-22).

## C. Optional integrations (disabled until approved)
- [ ] AI provider + monthly budget (copy generation currently uses the deterministic rules-v1 generator).
- [ ] Error monitoring provider; uptime monitor.
- [ ] Redis/edge rate limiting (DB limits already active).
- [ ] Payment gateway (out of scope; no payments are processed).
- [ ] Outbound email/WhatsApp integration (not enabled; CRM logs contacts manually).
- [ ] Customer testimonials/case studies with written permission.
