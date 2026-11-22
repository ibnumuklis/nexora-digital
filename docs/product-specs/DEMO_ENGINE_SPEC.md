# Protected Demo Engine — Functional Specification

## Goal
Let visitors explore approved product workflows without exposing production data, credentials, or privileged capabilities.

## Default policy
- Session duration: 7 minutes (configurable 5–10 minutes per product).
- Idle timeout: 90 seconds (configurable).
- Warnings: 60 seconds and 30 seconds remaining.
- One active session per visitor identity/browser policy, with abuse controls.
- Session expiry enforced by server time.

## Session lifecycle
1. Visitor selects Try Demo.
2. Server checks product publication/demo availability, capacity, rate limit, and policy.
3. Server creates an opaque random session identifier; store only a hash of bearer secrets where feasible.
4. Server provisions or assigns an isolated demo tenant/runtime using synthetic data.
5. Browser receives only a short-lived, scoped session credential.
6. Heartbeats and all protected actions validate session, product scope, expiry, and allowed permissions server-side.
7. Expired/terminated sessions are revoked and environment cleanup is queued.

## Demo environment requirements
- Separate from production database and credentials.
- Synthetic data only.
- Restricted user role and allowlisted workflows.
- No access to admin, billing, exports, secrets, or destructive actions unless specifically approved for the demo.
- Disposable tenant/database or resettable isolated environment.

## Watermark
Display NEXORA DIGITAL, DEMO VERSION, a non-sensitive session reference, and timestamp. Do not expose full token, IP address, email, or other personal data in watermark. Watermark is a deterrent, not a security control.

## Failure states
- Demo unavailable.
- Capacity reached.
- Session expired.
- Network interrupted.
- Product integration unhealthy.
- Cleanup pending.

Each state must have clear recovery guidance and a contact/quotation CTA.

## Acceptance tests
- Editing browser clock does not extend a session.
- Calling protected endpoints after expiry is rejected.
- Session A cannot access session B data.
- Demo cannot query production data.
- Rate limit prevents repeated automated session creation.
- Cleanup removes temporary data according to retention policy.
