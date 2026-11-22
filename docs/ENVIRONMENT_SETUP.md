# Environment Setup — Draft

Create `.env.local` locally and never commit it.

Expected variables (exact names may be refined during implementation):

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_PROVIDER_API_KEY=
REDIS_URL=
```

Rules:
- Only public Supabase URL and anon/publishable key may be exposed to the browser.
- Service role key, AI keys, Redis credentials, signing secrets, and integration credentials must remain server-side.
- Add `.env*` to `.gitignore`, except a sanitized `.env.example`.
- Validate required variables at startup and fail safely.
- Use separate credentials for local, staging, and production.
