-- APPLIED to live as version 20261122104234.
-- NEXORA reconciliation B: CRM/sales, public RPC entry points, demo engine, integrations,
-- content studio render jobs, analytics. Additive only (no DROP of tables/columns/data).

-- ===========================================================================
-- 0. Generic DB-side rate limiter (private)
-- ===========================================================================
create table if not exists private.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);
revoke all on private.rate_limits from public, anon, authenticated;

create or replace function private.hit_rate_limit(p_key text, p_limit integer, p_window interval)
returns boolean language plpgsql security definer set search_path = private, pg_temp as $$
declare v_start timestamptz := to_timestamp(floor(extract(epoch from now()) / extract(epoch from p_window)) * extract(epoch from p_window));
        v_hits integer;
begin
  insert into private.rate_limits(key, window_start, hits) values (p_key, v_start, 1)
  on conflict (key, window_start) do update set hits = private.rate_limits.hits + 1
  returning hits into v_hits;
  -- opportunistic cleanup of old windows
  if random() < 0.01 then delete from private.rate_limits where window_start < now() - interval '2 days'; end if;
  return v_hits <= p_limit; -- true = allowed
end $$;
revoke all on function private.hit_rate_limit(text, integer, interval) from public, anon, authenticated;

-- ===========================================================================
-- 1. CRM: leads, activities, sales inquiries / quotations
-- ===========================================================================
alter table public.leads
  add column if not exists privacy_consent boolean not null default false,
  add column if not exists privacy_consented_at timestamptz,
  add column if not exists marketing_consented_at timestamptz,
  add column if not exists owner_id uuid references auth.users(id) on delete set null,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists lost_reason text,
  add column if not exists score integer not null default 0,
  add column if not exists score_reasons jsonb not null default '[]',
  add column if not exists interest_label text,
  add column if not exists utm jsonb not null default '{}';
do $$ begin alter table public.leads add constraint leads_email_format check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'); exception when duplicate_object then null; end $$;
do $$ begin alter table public.leads add constraint leads_lengths check (coalesce(char_length(phone),0) <= 40 and coalesce(char_length(company),0) <= 160 and coalesce(char_length(industry),0) <= 80 and coalesce(char_length(need_description),0) <= 5000); exception when duplicate_object then null; end $$;
do $$ begin alter table public.leads add constraint leads_score_range check (score between 0 and 100); exception when duplicate_object then null; end $$;
do $$ begin alter table public.leads add constraint leads_source_values check (source in ('website','contact','product','demo','quote','consultation','partner','custom_development','manual','import')); exception when duplicate_object then null; end $$;
create index if not exists idx_leads_owner on public.leads(owner_id);
create index if not exists idx_leads_status_created on public.leads(status, created_at desc);
create index if not exists idx_leads_email_lower on public.leads(lower(email));
create index if not exists idx_leads_follow_up on public.leads(next_follow_up_at) where next_follow_up_at is not null;

alter table public.lead_activities
  add column if not exists metadata jsonb not null default '{}',
  add column if not exists due_at timestamptz,
  add column if not exists completed_at timestamptz;
do $$ begin alter table public.lead_activities add constraint lead_activities_type check (activity_type in ('note','call','meeting','email_logged','whatsapp_logged','status_change','follow_up','quote','system')); exception when duplicate_object then null; end $$;
do $$ begin alter table public.lead_activities add constraint lead_activities_notes_len check (coalesce(char_length(notes),0) <= 5000); exception when duplicate_object then null; end $$;

alter table public.sales_inquiries
  add column if not exists pricing_package_id uuid references public.pricing_packages(id) on delete set null,
  add column if not exists owner_id uuid references auth.users(id) on delete set null,
  add column if not exists quoted_amount numeric(14,2),
  add column if not exists currency text not null default 'IDR',
  add column if not exists valid_until date,
  add column if not exists proposal_notes text,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists sent_at timestamptz,
  add column if not exists closed_at timestamptz;
do $$ begin alter table public.sales_inquiries add constraint sales_inquiries_status check (status in ('new','qualifying','drafting','pending_approval','approved','sent','accepted','rejected','closed')); exception when duplicate_object then null; end $$;
do $$ begin alter table public.sales_inquiries add constraint sales_inquiries_amount check (quoted_amount is null or quoted_amount >= 0); exception when duplicate_object then null; end $$;
do $$ begin alter table public.sales_inquiries add constraint sales_inquiries_message_len check (char_length(message) between 1 and 5000); exception when duplicate_object then null; end $$;
create index if not exists idx_sales_inquiries_package on public.sales_inquiries(pricing_package_id);
create index if not exists idx_sales_inquiries_owner on public.sales_inquiries(owner_id);
create index if not exists idx_sales_inquiries_approved_by on public.sales_inquiries(approved_by);
create index if not exists idx_leads_owner_fk on public.leads(owner_id);

alter table public.pricing_packages add column if not exists tier text;
do $$ begin alter table public.pricing_packages add constraint pricing_packages_tier check (tier is null or tier in ('starter','professional','enterprise','custom')); exception when duplicate_object then null; end $$;
do $$ begin alter table public.pricing_packages add constraint pricing_packages_amount check (price_amount is null or price_amount >= 0); exception when duplicate_object then null; end $$;

-- Lead status change → timeline entry
create or replace function private.lead_status_activity() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status is distinct from old.status then
    insert into public.lead_activities(lead_id, activity_type, notes, created_by, metadata)
    values (new.id, 'status_change', null, auth.uid(), jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  if new.owner_id is distinct from old.owner_id then
    insert into public.lead_activities(lead_id, activity_type, notes, created_by, metadata)
    values (new.id, 'system', 'Owner changed', auth.uid(), jsonb_build_object('owner_changed', true));
  end if;
  return new;
end $$;
revoke all on function private.lead_status_activity() from public, anon, authenticated;
drop trigger if exists trg_leads_status_activity on public.leads;
create trigger trg_leads_status_activity after update on public.leads for each row execute function private.lead_status_activity();

-- Quote approval guard: only super_admin/admin can approve; stamps approver.
create or replace function private.guard_quote_approval() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    if not private.has_nexora_role(array['super_admin','admin']) then
      raise exception 'only admins can approve quotations' using errcode = '42501';
    end if;
    if new.quoted_amount is null and new.pricing_package_id is null then
      raise exception 'quotation requires an amount or a package before approval';
    end if;
    new.approved_by := auth.uid(); new.approved_at := now();
  end if;
  if new.status = 'sent' and old.status is distinct from 'sent' then
    if old.status <> 'approved' then raise exception 'quotation must be approved before it is marked sent'; end if;
    new.sent_at := now();
  end if;
  if new.status in ('accepted','rejected','closed') and old.status not in ('accepted','rejected','closed') then new.closed_at := now(); end if;
  return new;
end $$;
revoke all on function private.guard_quote_approval() from public, anon, authenticated;
drop trigger if exists trg_sales_inquiries_approval on public.sales_inquiries;
create trigger trg_sales_inquiries_approval before update on public.sales_inquiries for each row execute function private.guard_quote_approval();

-- Transparent rule-based lead score
create or replace function private.lead_score(p_inquiry_type text, p_has_product boolean, p_has_company boolean, p_has_phone boolean, p_need_len integer, p_repeat boolean)
returns jsonb language sql immutable as $$
  with r(points, reason) as (values
    (case p_inquiry_type when 'quotation' then 30 when 'license' then 25 when 'custom_development' then 25 when 'consultation' then 20 when 'partnership' then 10 else 0 end, 'inquiry_type:' || coalesce(p_inquiry_type,'contact')),
    (case when p_has_product then 10 else 0 end, 'product_specified'),
    (case when p_has_company then 10 else 0 end, 'company_provided'),
    (case when p_has_phone then 10 else 0 end, 'phone_provided'),
    (case when p_need_len >= 80 then 10 else 0 end, 'detailed_need'),
    (case when p_repeat then 15 else 0 end, 'repeat_inquiry'))
  select jsonb_build_object('score', least(100, sum(points))::int,
         'reasons', coalesce(jsonb_agg(jsonb_build_object('rule', reason, 'points', points)) filter (where points > 0), '[]'))
  from r
$$;

-- Public, validated, rate-limited entry point for every website form.
create or replace function public.submit_inquiry(p jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_name text := btrim(coalesce(p->>'full_name',''));
  v_email text := lower(btrim(coalesce(p->>'email','')));
  v_phone text := nullif(btrim(coalesce(p->>'phone','')),'');
  v_company text := nullif(btrim(coalesce(p->>'company','')),'');
  v_industry text := nullif(btrim(coalesce(p->>'industry','')),'');
  v_message text := btrim(coalesce(p->>'message',''));
  v_type text := coalesce(nullif(p->>'inquiry_type',''),'general');
  v_source text := coalesce(nullif(p->>'source',''),'contact');
  v_visitor text := coalesce(p->>'visitor_hash','');
  v_privacy boolean := coalesce((p->>'privacy_consent')::boolean, false);
  v_marketing boolean := coalesce((p->>'marketing_consent')::boolean, false);
  v_product_id uuid; v_lead_id uuid; v_repeat boolean := false; v_score jsonb;
begin
  if coalesce(p->>'website','') <> '' then return jsonb_build_object('ok', true); end if; -- honeypot
  if not v_privacy then raise exception 'consent_required'; end if;
  if char_length(v_name) not between 2 and 120 then raise exception 'invalid_name'; end if;
  if char_length(v_email) > 254 or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email'; end if;
  if char_length(v_message) not between 10 and 5000 then raise exception 'invalid_message'; end if;
  if v_phone is not null and (char_length(v_phone) > 40 or v_phone !~ '^[0-9+()\-\s.]{6,40}$') then raise exception 'invalid_phone'; end if;
  if char_length(coalesce(v_company,'')) > 160 or char_length(coalesce(v_industry,'')) > 80 then raise exception 'invalid_input'; end if;
  if v_type not in ('general','quotation','consultation','custom_development','license','partnership') then raise exception 'invalid_input'; end if;
  if v_source not in ('contact','product','demo','quote','consultation','partner','custom_development') then raise exception 'invalid_input'; end if;
  if v_visitor !~ '^[a-f0-9]{64}$' then v_visitor := 'unknown'; end if;

  if not private.hit_rate_limit('inq:email:' || encode(digest(v_email,'sha256'),'hex'), 3, interval '1 hour')
     or not private.hit_rate_limit('inq:visitor:' || v_visitor, 5, interval '1 hour')
     or not private.hit_rate_limit('inq:global', 300, interval '1 hour') then
    raise exception 'rate_limited';
  end if;

  if nullif(p->>'product_slug','') is not null then
    select id into v_product_id from public.products where slug = p->>'product_slug' and publication_status = 'published';
  end if;

  select id into v_lead_id from public.leads
   where lower(email) = v_email and status not in ('won','lost') and created_at > now() - interval '90 days'
   order by created_at desc limit 1;
  v_repeat := v_lead_id is not null;
  v_score := private.lead_score(nullif(v_type,'general'), v_product_id is not null, v_company is not null, v_phone is not null, char_length(v_message), v_repeat);

  if v_lead_id is null then
    insert into public.leads(full_name, email, phone, company, industry, product_id, source, need_description, status,
                             consent_marketing, privacy_consent, privacy_consented_at, marketing_consented_at,
                             score, score_reasons, interest_label, utm)
    values (v_name, v_email, v_phone, v_company, v_industry, v_product_id, v_source, v_message, 'new',
            v_marketing, true, now(), case when v_marketing then now() end,
            (v_score->>'score')::int, v_score->'reasons', left(nullif(p->>'interest_label',''), 120),
            case when jsonb_typeof(p->'utm') = 'object' and pg_column_size(p->'utm') < 1024 then p->'utm' else '{}'::jsonb end)
    returning id into v_lead_id;
  else
    update public.leads set
      score = greatest(score, (v_score->>'score')::int), score_reasons = v_score->'reasons',
      product_id = coalesce(product_id, v_product_id),
      consent_marketing = consent_marketing or v_marketing,
      marketing_consented_at = coalesce(marketing_consented_at, case when v_marketing then now() end)
    where id = v_lead_id;
    insert into public.lead_activities(lead_id, activity_type, notes, metadata)
    values (v_lead_id, 'system', 'Additional website inquiry received', jsonb_build_object('source', v_source, 'inquiry_type', v_type));
  end if;

  if v_type <> 'general' then
    insert into public.sales_inquiries(lead_id, product_id, inquiry_type, message, budget_range, timeline, status)
    values (v_lead_id, v_product_id, v_type, v_message, left(nullif(p->>'budget_range',''), 80), left(nullif(p->>'timeline',''), 80), 'new');
  end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.submit_inquiry(jsonb) from public;
grant execute on function public.submit_inquiry(jsonb) to anon, authenticated;

-- ===========================================================================
-- 2. Analytics (consent-aware, allowlisted)
-- ===========================================================================
do $$ begin alter table public.analytics_events add constraint analytics_event_allowlist check (event_name in
  ('page_view','product_view','search','cta_clicked','demo_cta_click','contact_cta_click','demo_started','demo_completed','demo_expired','inquiry_submitted','content_downloaded'));
exception when duplicate_object then null; end $$;
do $$ begin alter table public.analytics_events add constraint analytics_sizes check (pg_column_size(metadata) <= 2048 and coalesce(char_length(path),0) <= 300 and coalesce(char_length(source),0) <= 80); exception when duplicate_object then null; end $$;
create index if not exists idx_analytics_events_created on public.analytics_events(created_at desc);
create index if not exists idx_analytics_events_name_created on public.analytics_events(event_name, created_at desc);

create or replace function public.track_event(p_event text, p_path text default null, p_product_slug text default null,
  p_session_hash text default null, p_source text default null, p_metadata jsonb default '{}')
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare v_product uuid; v_session text := case when p_session_hash ~ '^[a-f0-9]{64}$' then p_session_hash end;
begin
  if p_event not in ('page_view','product_view','search','cta_clicked','demo_cta_click','contact_cta_click','inquiry_submitted','content_downloaded') then
    raise exception 'invalid_event';
  end if;
  if not private.hit_rate_limit('evt:' || coalesce(v_session,'anon'), 240, interval '1 hour')
     or not private.hit_rate_limit('evt:global', 50000, interval '1 hour') then return false; end if;
  if p_product_slug is not null then
    select id into v_product from public.products where slug = p_product_slug and publication_status = 'published';
  end if;
  insert into public.analytics_events(event_name, product_id, session_hash, source, path, metadata)
  values (p_event, v_product, v_session, left(p_source, 80),
          left(regexp_replace(coalesce(p_path,''), '[?#].*$', ''), 300), -- strip query strings (may contain PII)
          case when jsonb_typeof(p_metadata) = 'object' and pg_column_size(p_metadata) <= 1024 then p_metadata else '{}'::jsonb end);
  return true;
end $$;
revoke all on function public.track_event(text, text, text, text, text, jsonb) from public;
grant execute on function public.track_event(text, text, text, text, text, jsonb) to anon, authenticated;

alter table public.ai_recommendations
  add column if not exists kind text not null default 'measured',
  add column if not exists period_start timestamptz,
  add column if not exists period_end timestamptz,
  add column if not exists generated_by text not null default 'rules',
  add column if not exists created_by uuid references auth.users(id) on delete set null;
do $$ begin alter table public.ai_recommendations add constraint ai_recommendations_kind check (kind in ('measured','hypothesis')); exception when duplicate_object then null; end $$;
do $$ begin alter table public.ai_recommendations add constraint ai_recommendations_status check (status in ('new','accepted','dismissed','done')); exception when duplicate_object then null; end $$;
create index if not exists idx_ai_recommendations_creator on public.ai_recommendations(created_by);

-- Aggregates for the dashboard (SECURITY INVOKER: RLS applies to caller)
create or replace function public.analytics_overview(p_days integer default 30)
returns jsonb language sql stable security invoker set search_path = public, pg_temp as $$
  with ev as (select * from public.analytics_events where created_at >= now() - make_interval(days => greatest(1, least(p_days, 365))))
  select jsonb_build_object(
    'days', greatest(1, least(p_days, 365)),
    'generated_at', now(),
    'total_events', (select count(*) from ev),
    'unique_sessions', (select count(distinct session_hash) from ev where session_hash is not null),
    'by_event', coalesce((select jsonb_object_agg(event_name, c) from (select event_name, count(*) c from ev group by 1) x), '{}'),
    'by_day', coalesce((select jsonb_agg(jsonb_build_object('day', d, 'events', c, 'page_views', pv) order by d) from
        (select date_trunc('day', created_at)::date d, count(*) c, count(*) filter (where event_name='page_view') pv from ev group by 1) x), '[]'),
    'by_product', coalesce((select jsonb_agg(jsonb_build_object('product_id', product_id, 'name', name, 'views', views, 'demo_clicks', demo, 'demo_started', started, 'inquiries', inq) order by views desc) from
        (select e.product_id, p.name, count(*) filter (where event_name='product_view') views, count(*) filter (where event_name='demo_cta_click') demo,
                count(*) filter (where event_name='demo_started') started, count(*) filter (where event_name='inquiry_submitted') inq
           from ev e join public.products p on p.id = e.product_id group by 1,2) x), '[]'),
    'by_source', coalesce((select jsonb_object_agg(coalesce(source,'direct'), c) from (select source, count(*) c from ev group by 1) x), '{}'),
    'funnel', jsonb_build_object(
        'page_view', (select count(distinct session_hash) from ev where event_name='page_view'),
        'product_view', (select count(distinct session_hash) from ev where event_name='product_view'),
        'demo_cta_click', (select count(distinct session_hash) from ev where event_name='demo_cta_click'),
        'demo_started', (select count(*) from ev where event_name='demo_started'),
        'inquiry_submitted', (select count(distinct session_hash) from ev where event_name='inquiry_submitted')),
    'leads', jsonb_build_object(
        'total', (select count(*) from public.leads where created_at >= now() - make_interval(days => greatest(1, least(p_days, 365)))),
        'by_source', coalesce((select jsonb_object_agg(source, c) from (select source, count(*) c from public.leads where created_at >= now() - make_interval(days => greatest(1, least(p_days, 365))) group by 1) x), '{}'),
        'by_status', coalesce((select jsonb_object_agg(status, c) from (select status, count(*) c from public.leads group by 1) x), '{}'))
  )
$$;
revoke all on function public.analytics_overview(integer) from public, anon;
grant execute on function public.analytics_overview(integer) to authenticated;

-- ===========================================================================
-- 3. Demo engine (server time authoritative; tokens hashed)
-- ===========================================================================
alter table public.demo_policies
  add column if not exists max_concurrent_sessions integer not null default 10,
  add column if not exists sessions_per_visitor_per_hour integer not null default 6,
  add column if not exists mode text not null default 'sandbox',
  add column if not exists iframe_url text,
  add column if not exists allowed_modules text[] not null default '{}',
  add column if not exists disclaimer text not null default 'Demo uses synthetic sample data and restricted permissions. Do not enter personal or confidential information.';
do $$ begin alter table public.demo_policies add constraint demo_policies_mode check (mode in ('sandbox','iframe')); exception when duplicate_object then null; end $$;
do $$ begin alter table public.demo_policies add constraint demo_policies_limits check (max_concurrent_sessions between 1 and 500 and sessions_per_visitor_per_hour between 1 and 60 and max_active_sessions between 1 and 3); exception when duplicate_object then null; end $$;
do $$ begin alter table public.demo_policies add constraint demo_policies_iframe_https check (iframe_url is null or iframe_url ~ '^https://[a-z0-9.-]+(:[0-9]+)?(/.*)?$'); exception when duplicate_object then null; end $$;
do $$ begin alter table public.demo_policies add constraint demo_policies_iframe_required check (mode <> 'iframe' or iframe_url is not null); exception when duplicate_object then null; end $$;

create index if not exists idx_demo_sessions_status_expires on public.demo_sessions(status, expires_at);
create index if not exists idx_demo_sessions_visitor on public.demo_sessions(visitor_hash, started_at desc);

create table if not exists public.demo_session_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.demo_sessions(id) on delete cascade,
  event_type text not null check (event_type in ('started','heartbeat_rejected','expired','idle_timeout','ended','revoked','sandbox_view')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_demo_session_events_session on public.demo_session_events(session_id);
alter table public.demo_session_events enable row level security;
revoke all on public.demo_session_events from anon, authenticated;
grant select on public.demo_session_events to authenticated;
grant select, insert, update, delete on public.demo_session_events to service_role;
do $$ begin
  create policy admin_read_demo_events on public.demo_session_events for select to authenticated
    using ((select private.has_nexora_role(array['super_admin','admin'])));
exception when duplicate_object then null; end $$;

create or replace function private.demo_expire_overdue() returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  with x as (
    update public.demo_sessions s set status = 'expired', ended_at = now(),
      metadata = s.metadata || jsonb_build_object('end_reason', case when s.expires_at <= now() then 'duration' else 'idle' end)
    from public.demo_policies p
    where p.product_id = s.product_id and s.status = 'active'
      and (s.expires_at <= now() or s.last_seen_at + make_interval(secs => p.idle_timeout_seconds) <= now())
    returning s.id, s.expires_at)
  insert into public.demo_session_events(session_id, event_type)
  select id, case when expires_at <= now() then 'expired' else 'idle_timeout' end from x;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function private.demo_expire_overdue() from public, anon, authenticated;

create or replace function public.demo_start(p_slug text, p_visitor_hash text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_product public.products%rowtype; v_policy public.demo_policies%rowtype;
        v_token text; v_session public.demo_sessions%rowtype; v_active integer;
begin
  if p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or p_visitor_hash is null or p_visitor_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid_input';
  end if;
  perform private.demo_expire_overdue();
  select * into v_product from public.products where slug = p_slug and publication_status = 'published' and demo_enabled;
  if not found then raise exception 'demo_unavailable'; end if;
  select * into v_policy from public.demo_policies where product_id = v_product.id and enabled;
  if not found then raise exception 'demo_unavailable'; end if;

  if not private.hit_rate_limit('demo:visitor:' || p_visitor_hash, v_policy.sessions_per_visitor_per_hour, interval '1 hour')
     or not private.hit_rate_limit('demo:global', 2000, interval '1 hour') then
    raise exception 'rate_limited';
  end if;
  select count(*) into v_active from public.demo_sessions where visitor_hash = p_visitor_hash and status = 'active';
  if v_active >= v_policy.max_active_sessions then raise exception 'active_session_exists'; end if;
  perform pg_advisory_xact_lock(hashtext('demo:' || v_product.id::text));
  select count(*) into v_active from public.demo_sessions where product_id = v_product.id and status = 'active';
  if v_active >= v_policy.max_concurrent_sessions then raise exception 'capacity_reached'; end if;

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.demo_sessions(product_id, session_token_hash, visitor_hash, expires_at, metadata)
  values (v_product.id, encode(digest(v_token, 'sha256'), 'hex'), p_visitor_hash,
          now() + make_interval(mins => v_policy.duration_minutes),
          jsonb_build_object('duration_minutes', v_policy.duration_minutes, 'idle_timeout_seconds', v_policy.idle_timeout_seconds, 'mode', v_policy.mode))
  returning * into v_session;
  insert into public.demo_session_events(session_id, event_type) values (v_session.id, 'started');
  insert into public.analytics_events(event_name, product_id, source, metadata) values ('demo_started', v_product.id, 'demo', '{}');

  return jsonb_build_object(
    'session_id', v_session.id, 'token', v_token, 'session_ref', upper(left(replace(v_session.id::text,'-',''), 8)),
    'product_slug', v_product.slug, 'product_name', v_product.name,
    'started_at', v_session.started_at, 'expires_at', v_session.expires_at, 'server_now', now(),
    'duration_seconds', v_policy.duration_minutes * 60, 'idle_timeout_seconds', v_policy.idle_timeout_seconds,
    'warning_seconds', jsonb_build_array(60, 30), 'watermark', v_policy.watermark_text,
    'mode', v_policy.mode, 'iframe_url', case when v_policy.mode = 'iframe' then v_policy.iframe_url end,
    'disclaimer', v_policy.disclaimer, 'allowed_modules', to_jsonb(v_policy.allowed_modules));
end $$;
revoke all on function public.demo_start(text, text) from public;
grant execute on function public.demo_start(text, text) to anon, authenticated;

create or replace function public.demo_heartbeat(p_session_id uuid, p_token text, p_activity boolean default false)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_s public.demo_sessions%rowtype; v_idle integer; v_reason text;
begin
  if p_session_id is null or p_token is null or p_token !~ '^[a-f0-9]{64}$' then
    return jsonb_build_object('status', 'invalid', 'server_now', now());
  end if;
  select * into v_s from public.demo_sessions where id = p_session_id and session_token_hash = encode(digest(p_token, 'sha256'), 'hex') for update;
  if not found then return jsonb_build_object('status', 'invalid', 'server_now', now()); end if;
  select idle_timeout_seconds into v_idle from public.demo_policies where product_id = v_s.product_id;
  v_idle := coalesce(v_idle, 90);

  if v_s.status = 'active' then
    if v_s.expires_at <= now() then v_reason := 'duration';
    elsif v_s.last_seen_at + make_interval(secs => v_idle) <= now() then v_reason := 'idle';
    end if;
    if v_reason is not null then
      update public.demo_sessions set status = 'expired', ended_at = now(), metadata = metadata || jsonb_build_object('end_reason', v_reason) where id = v_s.id;
      insert into public.demo_session_events(session_id, event_type) values (v_s.id, case when v_reason = 'idle' then 'idle_timeout' else 'expired' end);
      insert into public.analytics_events(event_name, product_id, source) values ('demo_expired', v_s.product_id, 'demo');
      return jsonb_build_object('status', 'expired', 'reason', v_reason, 'server_now', now());
    end if;
    if p_activity then update public.demo_sessions set last_seen_at = now() where id = v_s.id; v_s.last_seen_at := now(); end if;
    return jsonb_build_object('status', 'active', 'server_now', now(), 'expires_at', v_s.expires_at,
      'remaining_seconds', greatest(0, floor(extract(epoch from (v_s.expires_at - now()))))::int,
      'idle_remaining_seconds', greatest(0, floor(extract(epoch from (v_s.last_seen_at + make_interval(secs => v_idle) - now()))))::int,
      'product_id', v_s.product_id);
  end if;
  return jsonb_build_object('status', v_s.status, 'reason', v_s.metadata->>'end_reason', 'server_now', now());
end $$;
revoke all on function public.demo_heartbeat(uuid, text, boolean) from public;
grant execute on function public.demo_heartbeat(uuid, text, boolean) to anon, authenticated;

create or replace function public.demo_end(p_session_id uuid, p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_id uuid; v_product uuid;
begin
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then return jsonb_build_object('ok', false); end if;
  update public.demo_sessions set status = 'ended', ended_at = now(), metadata = metadata || '{"end_reason":"user"}'
   where id = p_session_id and session_token_hash = encode(digest(p_token, 'sha256'), 'hex') and status = 'active'
   returning id, product_id into v_id, v_product;
  if v_id is null then return jsonb_build_object('ok', false); end if;
  insert into public.demo_session_events(session_id, event_type) values (v_id, 'ended');
  insert into public.analytics_events(event_name, product_id, source) values ('demo_completed', v_product, 'demo');
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.demo_end(uuid, text) from public;
grant execute on function public.demo_end(uuid, text) to anon, authenticated;

create or replace function public.demo_admin_revoke(p_session_id uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not private.has_nexora_role(array['super_admin','admin']) then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.demo_sessions set status = 'revoked', ended_at = now(), metadata = metadata || jsonb_build_object('end_reason','revoked','revoked_by',auth.uid())
   where id = p_session_id and status = 'active';
  if not found then return false; end if;
  insert into public.demo_session_events(session_id, event_type, metadata) values (p_session_id, 'revoked', jsonb_build_object('by', auth.uid()));
  return true;
end $$;
revoke all on function public.demo_admin_revoke(uuid) from public, anon;
grant execute on function public.demo_admin_revoke(uuid) to authenticated;

-- Cleanup: expire overdue + delete sessions older than retention (30 days)
create or replace function public.demo_cleanup(p_retention_days integer default 30)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_expired integer; v_deleted integer;
begin
  if current_user not in ('postgres','service_role') and not private.has_nexora_role(array['super_admin','admin']) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  v_expired := private.demo_expire_overdue();
  delete from public.demo_sessions where status <> 'active' and coalesce(ended_at, expires_at) < now() - make_interval(days => greatest(1, p_retention_days));
  get diagnostics v_deleted = row_count;
  delete from private.rate_limits where window_start < now() - interval '2 days';
  return jsonb_build_object('expired', v_expired, 'deleted', v_deleted, 'ran_at', now());
end $$;
revoke all on function public.demo_cleanup(integer) from public, anon;
grant execute on function public.demo_cleanup(integer) to authenticated, service_role;

-- Demo may only be enabled on a published, verified product.
create or replace function private.guard_demo_enable() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_table_name = 'products' then
    if new.demo_enabled and new.publication_status <> 'published' then raise exception 'demo can only be enabled for published products'; end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_products_demo_guard on public.products;
create trigger trg_products_demo_guard before insert or update on public.products for each row execute function private.guard_demo_enable();

-- ===========================================================================
-- 4. Integration center
-- ===========================================================================
alter table public.product_integrations
  add column if not exists display_name text,
  add column if not exists is_enabled boolean not null default false,
  add column if not exists check_path text not null default '/',
  add column if not exists last_status_code integer,
  add column if not exists last_latency_ms integer,
  add column if not exists last_error text;
do $$ begin alter table public.product_integrations add constraint product_integrations_https check (application_url is null or application_url ~ '^https://[a-z0-9.-]+(:[0-9]+)?(/.*)?$'); exception when duplicate_object then null; end $$;
do $$ begin alter table public.product_integrations add constraint product_integrations_healthy_requires_check check (health_status = 'unknown' or last_checked_at is not null); exception when duplicate_object then null; end $$;
do $$ begin alter table public.product_integrations add constraint product_integrations_check_path check (check_path ~ '^/[A-Za-z0-9._~/-]*$' and char_length(check_path) <= 200); exception when duplicate_object then null; end $$;

create table if not exists public.integration_check_logs (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.product_integrations(id) on delete cascade,
  checked_at timestamptz not null default now(),
  result text not null check (result in ('healthy','degraded','offline','blocked')),
  http_status integer, latency_ms integer, error text,
  checked_by uuid references auth.users(id) on delete set null
);
create index if not exists idx_integration_check_logs_integration on public.integration_check_logs(integration_id, checked_at desc);
create index if not exists idx_integration_check_logs_checked_by on public.integration_check_logs(checked_by);
alter table public.integration_check_logs enable row level security;
revoke all on public.integration_check_logs from anon, authenticated;
grant select, insert on public.integration_check_logs to authenticated;
grant select, insert, update, delete on public.integration_check_logs to service_role;
do $$ begin
  create policy staff_read_integration_logs on public.integration_check_logs for select to authenticated using ((select private.is_nexora_staff()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy admin_insert_integration_logs on public.integration_check_logs for insert to authenticated
    with check ((select private.has_nexora_role(array['super_admin','admin'])) and checked_by = (select auth.uid()));
exception when duplicate_object then null; end $$;

-- ===========================================================================
-- 5. Content studio: projects, assets, render jobs
-- ===========================================================================
alter table public.content_projects
  add column if not exists channel text,
  add column if not exists tone text,
  add column if not exists audience text,
  add column if not exists copy_draft jsonb not null default '{}',
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz;
do $$ begin alter table public.content_projects add constraint content_projects_status check (status in ('draft','in_review','approved','archived')); exception when duplicate_object then null; end $$;
create index if not exists idx_content_projects_approved_by on public.content_projects(approved_by);

create or replace function private.guard_content_approval() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    if not private.has_nexora_role(array['super_admin','admin','marketing_manager']) then
      raise exception 'only marketing managers or admins can approve content' using errcode = '42501';
    end if;
    new.approved_by := auth.uid(); new.approved_at := now();
  end if;
  if tg_op = 'UPDATE' and new.status <> 'approved' and old.status = 'approved' then new.approved_by := null; new.approved_at := null; end if;
  return new;
end $$;
revoke all on function private.guard_content_approval() from public, anon, authenticated;
drop trigger if exists trg_content_projects_approval on public.content_projects;
create trigger trg_content_projects_approval before insert or update on public.content_projects for each row execute function private.guard_content_approval();

alter table public.content_assets
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists duration_seconds numeric(8,2),
  add column if not exists checksum_sha256 text,
  add column if not exists status text not null default 'ready',
  add column if not exists render_job_id uuid,
  add column if not exists created_by uuid references auth.users(id) on delete set null;
do $$ begin alter table public.content_assets add constraint content_assets_status check (status in ('pending','ready','failed')); exception when duplicate_object then null; end $$;
create index if not exists idx_content_assets_created_by on public.content_assets(created_by);

create table if not exists public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  content_project_id uuid references public.content_projects(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  job_type text not null check (job_type in ('image','video')),
  output_format text not null check (output_format in ('png','jpg','mp4')),
  width integer not null check (width between 200 and 3840),
  height integer not null check (height between 200 and 3840),
  duration_seconds integer check (duration_seconds in (15,30,60)),
  template_key text not null check (template_key ~ '^[a-z0-9_-]{2,60}$'),
  input jsonb not null default '{}',
  status text not null default 'queued' check (status in ('queued','processing','completed','failed','canceled')),
  progress integer not null default 0 check (progress between 0 and 100),
  attempts integer not null default 0,
  max_attempts integer not null default 3 check (max_attempts between 1 and 5),
  error text,
  output_asset_id uuid references public.content_assets(id) on delete set null,
  provider text not null default 'nexora-ffmpeg-worker',
  cost_estimate numeric(10,4),
  locked_by text, locked_at timestamptz,
  requested_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), started_at timestamptz, finished_at timestamptz,
  constraint render_jobs_video_duration check (job_type <> 'video' or (duration_seconds is not null and output_format = 'mp4')),
  constraint render_jobs_image_format check (job_type <> 'image' or output_format in ('png','jpg')),
  constraint render_jobs_input_size check (pg_column_size(input) <= 32768)
);
create index if not exists idx_render_jobs_status on public.render_jobs(status, created_at);
create index if not exists idx_render_jobs_project on public.render_jobs(content_project_id);
create index if not exists idx_render_jobs_product on public.render_jobs(product_id);
create index if not exists idx_render_jobs_asset on public.render_jobs(output_asset_id);
create index if not exists idx_render_jobs_requested_by on public.render_jobs(requested_by);
do $$ begin alter table public.content_assets add constraint content_assets_render_job_fk foreign key (render_job_id) references public.render_jobs(id) on delete set null; exception when duplicate_object then null; end $$;
create index if not exists idx_content_assets_render_job on public.content_assets(render_job_id);
alter table public.render_jobs enable row level security;
revoke all on public.render_jobs from anon, authenticated;
grant select, insert, update on public.render_jobs to authenticated;
grant select, insert, update, delete on public.render_jobs to service_role;
do $$ begin
  create policy content_team_read_jobs on public.render_jobs for select to authenticated
    using ((select private.has_nexora_role(array['super_admin','admin','marketing_manager','content_editor'])));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy content_team_insert_jobs on public.render_jobs for insert to authenticated
    with check ((select private.has_nexora_role(array['super_admin','admin','marketing_manager','content_editor'])) and status = 'queued' and requested_by = (select auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy content_team_update_jobs on public.render_jobs for update to authenticated
    using ((select private.has_nexora_role(array['super_admin','admin','marketing_manager','content_editor'])))
    with check ((select private.has_nexora_role(array['super_admin','admin','marketing_manager','content_editor'])));
exception when duplicate_object then null; end $$;

-- Staff may only cancel (queued/processing → canceled) or retry (failed/canceled → queued); workers do the rest.
create or replace function private.guard_render_job_update() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if current_user in ('postgres','service_role','supabase_admin') then return new; end if;
  if new.status = old.status and new.progress = old.progress and new.output_asset_id is not distinct from old.output_asset_id then return new; end if;
  if (old.status in ('queued','processing') and new.status = 'canceled')
     or (old.status in ('failed','canceled') and new.status = 'queued' and old.attempts < old.max_attempts) then
    new.progress := case when new.status = 'queued' then 0 else old.progress end;
    new.output_asset_id := old.output_asset_id; new.error := case when new.status = 'queued' then null else old.error end;
    new.locked_by := null; new.locked_at := null;
    return new;
  end if;
  raise exception 'invalid render job transition % -> %', old.status, new.status using errcode = '42501';
end $$;
drop trigger if exists trg_render_jobs_guard on public.render_jobs;
create trigger trg_render_jobs_guard before update on public.render_jobs for each row execute function private.guard_render_job_update();

-- Worker API (service_role only)
create or replace function public.claim_render_job(p_worker text)
returns public.render_jobs language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.render_jobs;
begin
  -- release stale locks (> 15 min)
  update public.render_jobs set status = 'queued', locked_by = null, locked_at = null
   where status = 'processing' and locked_at < now() - interval '15 minutes' and attempts < max_attempts;
  select * into v from public.render_jobs where status = 'queued' and attempts < max_attempts
   order by created_at for update skip locked limit 1;
  if not found then return null; end if;
  update public.render_jobs set status = 'processing', locked_by = left(p_worker, 80), locked_at = now(),
         started_at = coalesce(started_at, now()), attempts = attempts + 1, progress = 1
   where id = v.id returning * into v;
  return v;
end $$;
revoke all on function public.claim_render_job(text) from public, anon, authenticated;
grant execute on function public.claim_render_job(text) to service_role;

create or replace function public.update_render_progress(p_job uuid, p_worker text, p_progress integer)
returns boolean language sql security definer set search_path = public, pg_temp as $$
  update public.render_jobs set progress = greatest(1, least(99, p_progress)), locked_at = now()
   where id = p_job and locked_by = p_worker and status = 'processing' returning true
$$;
revoke all on function public.update_render_progress(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.update_render_progress(uuid, text, integer) to service_role;

create or replace function public.complete_render_job(p_job uuid, p_worker text, p_storage_path text, p_mime text,
  p_size bigint, p_width integer, p_height integer, p_duration numeric, p_checksum text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.render_jobs; v_asset uuid;
begin
  select * into v from public.render_jobs where id = p_job and locked_by = p_worker and status = 'processing' for update;
  if not found then raise exception 'job not locked by this worker'; end if;
  if p_mime not in ('image/png','image/jpeg','video/mp4') or p_size <= 0 or p_width <> v.width or p_height <> v.height then
    raise exception 'output does not match job specification';
  end if;
  insert into public.content_assets(content_project_id, product_id, asset_type, storage_path, mime_type, file_size_bytes, title,
                                    width, height, duration_seconds, checksum_sha256, status, render_job_id, created_by, metadata)
  values (v.content_project_id, v.product_id, v.job_type, p_storage_path, p_mime, p_size, coalesce(v.input->>'title', v.template_key),
          p_width, p_height, p_duration, p_checksum, 'ready', v.id, v.requested_by, jsonb_build_object('template', v.template_key, 'verified', true))
  returning id into v_asset;
  update public.render_jobs set status = 'completed', progress = 100, output_asset_id = v_asset, finished_at = now(), error = null where id = v.id;
  return v_asset;
end $$;
revoke all on function public.complete_render_job(uuid, text, text, text, bigint, integer, integer, numeric, text) from public, anon, authenticated;
grant execute on function public.complete_render_job(uuid, text, text, text, bigint, integer, integer, numeric, text) to service_role;

create or replace function public.fail_render_job(p_job uuid, p_worker text, p_error text)
returns boolean language sql security definer set search_path = public, pg_temp as $$
  update public.render_jobs set status = case when attempts >= max_attempts then 'failed' else 'queued' end,
         error = left(p_error, 1000), locked_by = null, locked_at = null,
         finished_at = case when attempts >= max_attempts then now() end
   where id = p_job and locked_by = p_worker and status = 'processing' returning true
$$;
revoke all on function public.fail_render_job(uuid, text, text) from public, anon, authenticated;
grant execute on function public.fail_render_job(uuid, text, text) to service_role;

-- ===========================================================================
-- 6. Storage: public bucket for approved, public product imagery only
-- ===========================================================================
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('nexora-public', 'nexora-public', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;
do $$ begin
  create policy "Nexora content team can upload public images" on storage.objects for insert to authenticated
    with check (bucket_id = 'nexora-public' and (select private.has_nexora_role(array['super_admin','admin','marketing_manager','content_editor'])));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Nexora content team can update public images" on storage.objects for update to authenticated
    using (bucket_id = 'nexora-public' and (select private.has_nexora_role(array['super_admin','admin','marketing_manager','content_editor'])))
    with check (bucket_id = 'nexora-public' and (select private.has_nexora_role(array['super_admin','admin','marketing_manager','content_editor'])));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Nexora admins can delete public images" on storage.objects for delete to authenticated
    using (bucket_id = 'nexora-public' and (select private.has_nexora_role(array['super_admin','admin'])));
exception when duplicate_object then null; end $$;

-- ===========================================================================
-- 7. Staff onboarding: super admin assigns a role to an existing (confirmed) auth user by email
-- ===========================================================================
create or replace function public.grant_staff_role(p_email text, p_role text)
returns uuid language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare v_uid uuid;
begin
  if not private.has_nexora_role(array['super_admin']) then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_role not in ('super_admin','admin','marketing_manager','sales_manager','content_editor') then raise exception 'invalid_role'; end if;
  select id into v_uid from auth.users where lower(email) = lower(btrim(p_email)) and email_confirmed_at is not null;
  if v_uid is null then raise exception 'user_not_found_or_unconfirmed'; end if;
  insert into public.staff_members(user_id, role, is_active) values (v_uid, p_role, true)
  on conflict (user_id) do update set role = excluded.role, is_active = true;
  return v_uid;
end $$;
revoke all on function public.grant_staff_role(text, text) from public, anon;
grant execute on function public.grant_staff_role(text, text) to authenticated;

-- New tables: service role grants (worker)
grant select, insert, update, delete on all tables in schema public to service_role;
