# Environment setup

See `.env.example` and the variable table in `docs/DEPLOYMENT_GUIDE.md` §2.
Only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SITE_URL` may reach the browser. `SUPABASE_SERVICE_ROLE_KEY` belongs exclusively to the render-worker host (and optionally CI secrets for live E2E).
