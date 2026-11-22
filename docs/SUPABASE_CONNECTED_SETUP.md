# Supabase connection — NEXORA DIGITAL

Connected project verified: `nexora-digital`

- Project ref: `ijkazeukjooauwsvwtiq`
- API URL: `https://ijkazeukjooauwsvwtiq.supabase.co`
- Region: `ap-northeast-1` (Tokyo)
- Status at verification: `ACTIVE_HEALTHY`
- Public key: use the publishable key in `.env.local` (safe for browser only when RLS is correctly configured).

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Keep the URL and publishable key values already supplied.
3. Run `npm install`, then `npm run dev`.
4. Never put a secret/service-role key in a `NEXT_PUBLIC_` variable or commit it.

## First administrator

1. In Supabase Dashboard > Authentication > Users, create the first owner account.
2. Copy that account's Auth user UUID.
3. In SQL Editor, run the following after replacing the UUID with your own account UUID:

```sql
insert into public.staff_members (user_id, role, is_active)
values ('YOUR_AUTH_USER_UUID', 'super_admin', true)
on conflict (user_id) do update set role = excluded.role, is_active = true;
```

Do not share the password or secret keys in chat.

## Database status

The following migrations have been applied and verified:

- `nexora_initial_catalog`
- `nexora_core_modules_and_rls`
- `nexora_security_hardening_and_indexes`
- `nexora_private_authorization_helpers`

Seeded catalog: four categories and five products. All five products remain unpublished drafts until their descriptions, readiness, screenshots, URLs, demo environments, and commercial terms are reviewed.

`demo_sessions` intentionally has RLS enabled and no direct client policies: session writes/reads must go through authenticated server-side code or Edge Functions.
