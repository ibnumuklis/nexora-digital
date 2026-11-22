# Implementation guide

Superseded by the rebuilt application (2026-11-22). Use:
- `README.md` — local setup and scripts
- `docs/DEPLOYMENT_GUIDE.md` — environment variables, Supabase Auth URLs, deploy steps
- `docs/adr/README.md` — architecture decisions (live schema canonical, RBAC, RPC entry points, SSRF, rendering, demo isolation)
- `docs/RENDER_WORKER.md` — MP4 worker
- `docs/RUNBOOK.md` — operations

Staff roles are stored in `public.staff_members` (not `user_roles`). Assign them in Admin → Staff (Super Admin), never by browser-side code.
