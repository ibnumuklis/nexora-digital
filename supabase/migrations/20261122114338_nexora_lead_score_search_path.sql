-- APPLIED to live as version 20261122114338.
-- NEXORA reconciliation C: pin search_path on private.lead_score (advisor: function_search_path_mutable).
alter function private.lead_score(text, boolean, boolean, boolean, integer, boolean) set search_path = pg_catalog, pg_temp;
revoke all on function private.lead_score(text, boolean, boolean, boolean, integer, boolean) from public, anon, authenticated;
