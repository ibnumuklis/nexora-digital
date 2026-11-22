-- APPLIED to live as version 20261122123507.
-- Maintenance: idx_leads_owner_fk duplicates idx_leads_owner (advisor duplicate_index). No data impact.
drop index if exists public.idx_leads_owner_fk;
