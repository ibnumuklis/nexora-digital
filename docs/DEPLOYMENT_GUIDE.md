# Deployment Guide

## Current status

Deployment has not been performed. No production domain, Vercel project, or production secrets have been configured.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Production deployment outline

1. Create a dedicated Supabase project in the selected organisation and region.
2. Apply the SQL migrations in order after review.
3. Create the initial Auth user and assign `super_admin` through a trusted SQL editor.
4. Configure environment variables in the hosting project.
5. Connect the Git repository to Vercel or the selected Next.js host.
6. Configure the production domain and TLS.
7. Configure separate demo deployments and server-side proxy allowlists.
8. Add Redis/edge rate limiting, monitoring, backups, and alerting.
9. Run build, tests, security review, accessibility checks, and production smoke tests.
10. Publish products only after real URLs, product claims, legal terms, pricing, and demo availability are verified.

## Required secrets

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `AI_PROVIDER_API_KEY` (only after provider and budget approval)
- `REDIS_URL` (if using Redis rate limiting/session support)

Never commit `.env.local` or production secrets.
