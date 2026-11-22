# API Documentation — NEXORA DIGITAL

All endpoints are same-origin Next.js route handlers. Public endpoints validate input and must be protected by production-grade rate limiting before launch. Admin endpoints verify Supabase Auth and staff role on the server, while database RLS remains authoritative.

## Public endpoints

### `POST /api/leads`
Accepts `name`, `email`, `company`, `interest`, `message`, and required `consent: "yes"`. Writes a lead using server-only Supabase service credentials. Requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Includes a small in-memory request throttle; replace with a distributed Redis/edge limiter in production.

### `POST /api/analytics`
Accepts allowlisted event names: `page_view`, `product_view`, `demo_cta_click`, `contact_cta_click`. Stores basic event metadata when Supabase is configured. Instrumentation is not yet connected to every page.

### `POST /api/demo/session`
Accepts `{ "slug": "product-slug" }`. Requires a published product and enabled demo policy. Creates a short-lived random token, stores only its SHA-256 hash, and returns the raw token once. Uses server-only service credentials.

### `POST /api/demo/session/:id/heartbeat`
Accepts `{ "token": "..." }`. Validates token, expiry and idle policy; updates last activity.

### `POST /api/demo/session/:id/end`
Accepts `{ "token": "..." }`. Marks an active session completed.

## Admin endpoints

All require an authenticated Supabase user with an allowed row in `public.user_roles`.

- `GET /api/admin/products` — list products with categories and features.
- `POST /api/admin/products` — create a draft product.
- `PATCH /api/admin/products/:id` — update allowed product fields.
- `DELETE /api/admin/products/:id` — delete a product; review dependencies before use.
- `GET /api/admin/leads` — list up to 200 recent leads for authorised staff.
- `GET /api/admin/content` — list recent content projects.
- `POST /api/admin/content` — create a content project.

## Security notes

- Never send the service role key to a browser.
- Admin API routes independently verify the user and role.
- Validate request body size and schema in production.
- Add distributed rate limits, CAPTCHA/abuse checks, audit events and observability.
- The demo session lifecycle is scaffolding; a real product proxy must validate the token on every protected request.
