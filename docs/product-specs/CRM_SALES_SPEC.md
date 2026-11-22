# CRM & Sales — Functional Specification

## Lead capture
Sources: contact form, product inquiry, demo CTA, quotation request, consultation, partner application. Capture only necessary data and record marketing consent separately.

## Lead fields
Name, email, phone, organization, industry, interested product, source, requirement summary, lifecycle stage, owner, next follow-up date, consent flags, created/updated timestamps.

## Lifecycle
New → Contacted → Qualified → Negotiation → Proposal Sent → Won/Lost. Admins may configure stages later, but changes must be audited.

## Activity timeline
Record calls/meetings/notes/status changes and follow-up events. Do not send emails or WhatsApp messages automatically without explicit integration, consent, and user approval.

## Quotation workflow
1. Create inquiry.
2. Qualify need and scope.
3. Select product/service and commercial model.
4. Draft proposal/quotation.
5. Review and approve.
6. Record sent status and follow-up.
7. Record outcome.

## Lead scoring
Start with transparent rule-based scoring (e.g., explicit request for quotation, consultation booked, repeated product interest). Clearly label the score as an internal prioritization aid, not a verified prediction. AI scoring may be added only after sufficient data and evaluation.

## Acceptance tests
- Form validation and anti-spam work.
- Consent choices are stored and respected.
- Public users cannot read other leads.
- Staff permissions restrict export and assignment.
- Status changes and exports are audited.
