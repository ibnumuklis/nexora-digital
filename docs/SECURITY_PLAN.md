# Security Plan

## Security objectives
Protect admin access, customer/prospect data, product integration credentials, demo environments, and generated assets.

## Mandatory controls
- Supabase RLS on all exposed tables.
- Server-side authorization for every privileged operation.
- Least-privilege role permissions.
- MFA for privileged accounts where supported.
- Short-lived demo tokens scoped to product/session.
- Server-enforced session expiry and idle timeout.
- Synthetic demo data and isolated demo environments.
- API rate limiting and abuse detection.
- Input validation and output encoding.
- Secure cookies and appropriate CSRF controls.
- CSP, HSTS, and secure response headers in production.
- Upload MIME/type/size validation and safe storage policies.
- Secrets only in server-side environment variables/secret manager.
- Audit logs for privileged changes and security events.
- Dependency scanning and regular updates.
- Backups and tested restore process.

## Important limitations
Watermarks discourage unattributed reuse but do not prevent screenshots, screen recording, browser inspection, or copying of assets delivered to a browser. Do not promise absolute copy protection. Keep proprietary business logic server-side and minimize client exposure.

## Demo threat model
Threats: token sharing, session replay, automated scraping, privilege escalation, cross-tenant access, API abuse, data leakage, SSRF through integration checks.

Mitigations: short TTL, rotation, server-side scope checks, per-session limits, rate limiting, isolated tenant/runtime, synthetic data, allowlisted integration hosts, outbound network restrictions, audit logs, and automated cleanup.

## Production gate
No production launch until RLS tests, authorization tests, demo isolation tests, dependency review, secret scan, backup/restore check, and incident response contacts are documented.
