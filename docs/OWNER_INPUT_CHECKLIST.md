# NEXORA DIGITAL — Owner Input Checklist (updated 2026-11-22)

Engineering work that does not depend on these items is complete. Items are ordered by impact.

## A. To finish verification (quick)
- [ ] **Enable live tests** — either add GitHub repository secrets `E2E_SUPABASE_URL` (`https://ijkazeukjooauwsvwtiq.supabase.co`) and `E2E_SUPABASE_SERVICE_ROLE_KEY` (Settings → Secrets → Actions; never paste the key in chat), **or** allow the domain `ijkazeukjooauwsvwtiq.supabase.co` for this Claude workspace (claude.ai → Settings → Capabilities). This runs the live authentication/session/password suite.
- [ ] Supabase Dashboard → Authentication → URL Configuration: Site URL + Redirect URL `<site>/auth/callback` (and `http://localhost:3000/auth/callback`).
- [ ] Authentication → Providers → Email → Minimum password length **12**.
- [ ] Custom SMTP (needed to email staff who are not Supabase team members).
- [ ] Decide whether to enforce TOTP MFA for admin roles.

## B. Before public launch
- [ ] Official domain & DNS access; hosting for web app (recommended Vercel) and for the render worker (container/VM with ffmpeg).
- [ ] Legal entity, address, contact email; approve Privacy Policy, Terms, Cookie policy, Demo disclaimer (drafts in the site).
- [ ] Official logo/brand files (current mark is a placeholder "N" monogram in brand colours).
- [ ] Per product (Waroeng Suramadu ERP, Marcom Command Center, EDU ADMIN, EDUCLASS, AI Content Repurposing Studio): approved description, features, audience, stage, pricing model/packages, screenshots, product URL, demo approach (sandbox or isolated demo URL), then **Verify → Publish** in Admin.
- [ ] Verified product domains for `INTEGRATION_ALLOWED_HOSTS`; isolated demo hosts for `DEMO_IFRAME_HOSTS`.
- [ ] Explicit production deployment approval.

## C. Optional integrations (disabled until approved)
- [ ] AI provider + monthly budget (copy generation currently uses the deterministic rules-v1 generator).
- [ ] Error monitoring provider; uptime monitor.
- [ ] Redis/edge rate limiting (DB limits already active).
- [ ] Payment gateway (out of scope; no payments are processed).
- [ ] Outbound email/WhatsApp integration (not enabled; CRM logs contacts manually).
- [ ] Customer testimonials/case studies with written permission.
