# Legacy, NEVER-APPLIED migrations

These two files came with the original handoff package. They were written for a clean
database and were **never applied** to the live project `ijkazeukjooauwsvwtiq`. They diverge
from the live schema (`user_roles` vs `staff_members`, `token_hash` vs `session_token_hash`, etc.).

They are kept for historical reference only. **Do not apply them.** The canonical schema is
`supabase/migrations/` (copied verbatim from `supabase_migrations.schema_migrations` on 2026-11-22,
plus new additive migrations).
