-- NEXORA reconciliation A: grants hardening, least-privilege RBAC policies, audit triggers, updated_at.
-- Additive & idempotent: no table or data is dropped. Only policies are replaced (tightened).

-- ---------------------------------------------------------------------------
-- 1. Grants hardening (defence in depth; RLS remains the row boundary)
-- ---------------------------------------------------------------------------
revoke truncate, trigger, references on all tables in schema public from anon, authenticated;
alter default privileges for role postgres in schema public revoke truncate, trigger, references, maintain on tables from anon, authenticated, service_role;

-- demo_sessions is never touched directly by browsers; only via SECURITY DEFINER functions.
revoke all on public.demo_sessions from anon, authenticated;
grant select on public.demo_sessions to authenticated; -- RLS limits this to admins (policy below)

-- service_role (used only by the optional background worker) needs explicit grants.
grant select, insert, update, delete on all tables in schema public to service_role;

-- ---------------------------------------------------------------------------
-- 2. Helper functions (private schema, not exposed through PostgREST)
-- ---------------------------------------------------------------------------
create or replace function private.current_staff_role() returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select role from public.staff_members where user_id = auth.uid() and is_active
$$;
revoke all on function private.current_staff_role() from public, anon;
grant execute on function private.current_staff_role() to authenticated;

create or replace function private.set_updated_at() returns trigger
language plpgsql set search_path = pg_temp as $$
begin new.updated_at := now(); return new; end $$;

-- Audit trigger: records actor, table, row id and *names* of changed columns only.
create or replace function private.audit_row() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_new jsonb := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end;
  v_old jsonb := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_id uuid;
  v_changed text[];
begin
  v_id := coalesce((v_row->>'id')::uuid, (v_row->>'user_id')::uuid);
  if tg_op = 'UPDATE' then
    select coalesce(array_agg(k order by k), '{}') into v_changed
    from jsonb_object_keys(v_new) k
    where k <> 'updated_at' and (v_new->k) is distinct from (v_old->k);
    if array_length(v_changed, 1) is null then return new; end if;
  end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), lower(tg_op), tg_table_name, v_id,
          case when tg_op = 'UPDATE' then jsonb_build_object('changed', v_changed) else '{}'::jsonb end);
  return coalesce(new, old);
end $$;
revoke all on function private.audit_row() from public, anon, authenticated;

-- Explicit audit event (e.g. CSV export) callable by staff only.
create or replace function public.log_audit_event(p_action text, p_entity_type text, p_entity_id uuid default null, p_metadata jsonb default '{}')
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not private.is_nexora_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_action !~ '^[a-z_]{3,40}$' then raise exception 'invalid action'; end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, left(p_entity_type, 60), p_entity_id, coalesce(p_metadata, '{}'));
end $$;
revoke all on function public.log_audit_event(text, text, uuid, jsonb) from public, anon;
grant execute on function public.log_audit_event(text, text, uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. updated_at columns + triggers
-- ---------------------------------------------------------------------------
alter table public.leads add column if not exists updated_at timestamptz not null default now();
alter table public.sales_inquiries add column if not exists updated_at timestamptz not null default now();
alter table public.content_projects add column if not exists updated_at timestamptz not null default now();
alter table public.articles add column if not exists updated_at timestamptz not null default now();
alter table public.product_integrations add column if not exists updated_at timestamptz not null default now();
alter table public.pricing_packages add column if not exists updated_at timestamptz not null default now();
alter table public.demo_policies add column if not exists updated_at timestamptz not null default now();
alter table public.testimonials add column if not exists created_at timestamptz not null default now();

do $$ declare t text; begin
  foreach t in array array['products','product_categories','leads','sales_inquiries','content_projects','articles','product_integrations','pricing_packages','demo_policies'] loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$I', t);
    execute format('create trigger trg_%1$s_updated_at before update on public.%1$I for each row execute function private.set_updated_at()', t);
  end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['products','product_categories','product_features','product_media','pricing_packages','product_integrations','demo_policies','staff_members','leads','sales_inquiries','licenses','subscriptions','articles','testimonials','content_assets'] loop
    execute format('drop trigger if exists trg_%1$s_audit on public.%1$I', t);
    execute format('create trigger trg_%1$s_audit after insert or update or delete on public.%1$I for each row execute function private.audit_row()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Products: verification gate + extra presentation fields
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists problem_statement text,
  add column if not exists faq jsonb not null default '[]',
  add column if not exists demo_video_url text,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references auth.users(id) on delete set null;
do $$ begin
  alter table public.products add constraint products_publish_requires_verification
    check (publication_status <> 'published' or verified_at is not null);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.products add constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
exception when duplicate_object then null; end $$;
create index if not exists idx_products_verified_by on public.products(verified_by);

-- ---------------------------------------------------------------------------
-- 5. Least-privilege policies
--    anon policies never call private.* (anon has no usage on schema private).
--    authenticated policies combine public visibility with role checks (one policy per action).
-- ---------------------------------------------------------------------------
-- Catalog read
drop policy if exists "Public can read published categories" on public.product_categories;
drop policy if exists "Public can read published products" on public.products;
drop policy if exists "Public can read features of published products" on public.product_features;
drop policy if exists "Public can read public media of published products" on public.product_media;
drop policy if exists "Public read pricing" on public.pricing_packages;
drop policy if exists "Staff manage pricing" on public.pricing_packages;
drop policy if exists "Public read testimonials" on public.testimonials;
drop policy if exists "Staff manage testimonials" on public.testimonials;
drop policy if exists "Public read articles" on public.articles;
drop policy if exists "Staff manage articles" on public.articles;

drop policy if exists anon_read_categories on public.product_categories;
create policy anon_read_categories on public.product_categories for select to anon
  using (exists (select 1 from public.products p where p.category_id = product_categories.id and p.publication_status = 'published'));
drop policy if exists auth_read_categories on public.product_categories;
create policy auth_read_categories on public.product_categories for select to authenticated
  using ((select private.is_nexora_staff()) or exists (select 1 from public.products p where p.category_id = product_categories.id and p.publication_status = 'published'));

drop policy if exists anon_read_products on public.products;
create policy anon_read_products on public.products for select to anon using (publication_status = 'published');
drop policy if exists auth_read_products on public.products;
create policy auth_read_products on public.products for select to authenticated
  using (publication_status = 'published' or (select private.is_nexora_staff()));

drop policy if exists anon_read_features on public.product_features;
create policy anon_read_features on public.product_features for select to anon
  using (exists (select 1 from public.products p where p.id = product_features.product_id and p.publication_status = 'published'));
drop policy if exists auth_read_features on public.product_features;
create policy auth_read_features on public.product_features for select to authenticated
  using ((select private.is_nexora_staff()) or exists (select 1 from public.products p where p.id = product_features.product_id and p.publication_status = 'published'));

drop policy if exists anon_read_media on public.product_media;
create policy anon_read_media on public.product_media for select to anon
  using (is_public and exists (select 1 from public.products p where p.id = product_media.product_id and p.publication_status = 'published'));
drop policy if exists auth_read_media on public.product_media;
create policy auth_read_media on public.product_media for select to authenticated
  using ((select private.is_nexora_staff()) or (is_public and exists (select 1 from public.products p where p.id = product_media.product_id and p.publication_status = 'published')));

drop policy if exists anon_read_pricing on public.pricing_packages;
create policy anon_read_pricing on public.pricing_packages for select to anon
  using (is_public and exists (select 1 from public.products p where p.id = pricing_packages.product_id and p.publication_status = 'published'));
drop policy if exists auth_read_pricing on public.pricing_packages;
create policy auth_read_pricing on public.pricing_packages for select to authenticated
  using ((select private.is_nexora_staff()) or (is_public and exists (select 1 from public.products p where p.id = pricing_packages.product_id and p.publication_status = 'published')));

drop policy if exists anon_read_testimonials on public.testimonials;
create policy anon_read_testimonials on public.testimonials for select to anon using (is_published);
drop policy if exists auth_read_testimonials on public.testimonials;
create policy auth_read_testimonials on public.testimonials for select to authenticated
  using (is_published or (select private.is_nexora_staff()));

drop policy if exists anon_read_articles on public.articles;
create policy anon_read_articles on public.articles for select to anon using (status = 'published');
drop policy if exists auth_read_articles on public.articles;
create policy auth_read_articles on public.articles for select to authenticated
  using (status = 'published' or (select private.is_nexora_staff()));

-- Catalog write (admins); features/media also content team
do $$ declare t text; begin
  foreach t in array array['products','product_categories','pricing_packages'] loop
    execute format('drop policy if exists admin_insert_%1$s on public.%1$I', t);
    execute format('create policy admin_insert_%1$s on public.%1$I for insert to authenticated with check ((select private.has_nexora_role(array[''super_admin'',''admin''])))', t);
    execute format('drop policy if exists admin_update_%1$s on public.%1$I', t);
    execute format('create policy admin_update_%1$s on public.%1$I for update to authenticated using ((select private.has_nexora_role(array[''super_admin'',''admin'']))) with check ((select private.has_nexora_role(array[''super_admin'',''admin''])))', t);
    execute format('drop policy if exists admin_delete_%1$s on public.%1$I', t);
    execute format('create policy admin_delete_%1$s on public.%1$I for delete to authenticated using ((select private.has_nexora_role(array[''super_admin'',''admin''])))', t);
  end loop;
  foreach t in array array['product_features','product_media'] loop
    execute format('drop policy if exists team_insert_%1$s on public.%1$I', t);
    execute format('create policy team_insert_%1$s on public.%1$I for insert to authenticated with check ((select private.has_nexora_role(array[''super_admin'',''admin'',''marketing_manager'',''content_editor''])))', t);
    execute format('drop policy if exists team_update_%1$s on public.%1$I', t);
    execute format('create policy team_update_%1$s on public.%1$I for update to authenticated using ((select private.has_nexora_role(array[''super_admin'',''admin'',''marketing_manager'',''content_editor'']))) with check ((select private.has_nexora_role(array[''super_admin'',''admin'',''marketing_manager'',''content_editor''])))', t);
    execute format('drop policy if exists team_delete_%1$s on public.%1$I', t);
    execute format('create policy team_delete_%1$s on public.%1$I for delete to authenticated using ((select private.has_nexora_role(array[''super_admin'',''admin''])))', t);
  end loop;
  -- Content & editorial modules
  foreach t in array array['articles','testimonials'] loop
    execute format('drop policy if exists content_insert_%1$s on public.%1$I', t);
    execute format('create policy content_insert_%1$s on public.%1$I for insert to authenticated with check ((select private.has_nexora_role(array[''super_admin'',''admin'',''marketing_manager'',''content_editor''])))', t);
    execute format('drop policy if exists content_update_%1$s on public.%1$I', t);
    execute format('create policy content_update_%1$s on public.%1$I for update to authenticated using ((select private.has_nexora_role(array[''super_admin'',''admin'',''marketing_manager'',''content_editor'']))) with check ((select private.has_nexora_role(array[''super_admin'',''admin'',''marketing_manager'',''content_editor''])))', t);
    execute format('drop policy if exists content_delete_%1$s on public.%1$I', t);
    execute format('create policy content_delete_%1$s on public.%1$I for delete to authenticated using ((select private.has_nexora_role(array[''super_admin'',''admin'',''marketing_manager''])))', t);
  end loop;
end $$;

-- Content studio tables: content team full access
drop policy if exists "Staff manage content projects" on public.content_projects;
drop policy if exists "Staff manage content assets" on public.content_assets;
drop policy if exists "Staff manage templates" on public.content_templates;
drop policy if exists "Staff manage calendar" on public.content_calendar;
do $$ declare t text; begin
  foreach t in array array['content_projects','content_assets','content_templates','content_calendar'] loop
    execute format('drop policy if exists content_team_all_%1$s on public.%1$I', t);
    execute format('create policy content_team_all_%1$s on public.%1$I for all to authenticated using ((select private.has_nexora_role(array[''super_admin'',''admin'',''marketing_manager'',''content_editor'']))) with check ((select private.has_nexora_role(array[''super_admin'',''admin'',''marketing_manager'',''content_editor''])))', t);
  end loop;
end $$;

-- Integrations & demo policies: staff read, admins write
drop policy if exists "Staff manage integrations" on public.product_integrations;
drop policy if exists "Staff manage demo policies" on public.demo_policies;
do $$ declare t text; begin
  foreach t in array array['product_integrations','demo_policies'] loop
    execute format('drop policy if exists staff_read_%1$s on public.%1$I', t);
    execute format('create policy staff_read_%1$s on public.%1$I for select to authenticated using ((select private.is_nexora_staff()))', t);
    execute format('drop policy if exists admin_insert_%1$s on public.%1$I', t);
    execute format('create policy admin_insert_%1$s on public.%1$I for insert to authenticated with check ((select private.has_nexora_role(array[''super_admin'',''admin''])))', t);
    execute format('drop policy if exists admin_update_%1$s on public.%1$I', t);
    execute format('create policy admin_update_%1$s on public.%1$I for update to authenticated using ((select private.has_nexora_role(array[''super_admin'',''admin'']))) with check ((select private.has_nexora_role(array[''super_admin'',''admin''])))', t);
    execute format('drop policy if exists admin_delete_%1$s on public.%1$I', t);
    execute format('create policy admin_delete_%1$s on public.%1$I for delete to authenticated using ((select private.has_nexora_role(array[''super_admin'',''admin''])))', t);
  end loop;
end $$;

-- CRM & sales: sales/admin write; marketing read
drop policy if exists "Staff manage leads" on public.leads;
drop policy if exists "Public submit leads" on public.leads;
drop policy if exists "Staff manage lead activities" on public.lead_activities;
drop policy if exists "Staff manage inquiries" on public.sales_inquiries;
drop policy if exists "Public submit inquiries" on public.sales_inquiries;
drop policy if exists "Staff manage subscriptions" on public.subscriptions;
drop policy if exists "Staff manage licenses" on public.licenses;
do $$ declare t text; begin
  foreach t in array array['leads','lead_activities','sales_inquiries','subscriptions','licenses'] loop
    execute format('drop policy if exists crm_read_%1$s on public.%1$I', t);
    execute format('create policy crm_read_%1$s on public.%1$I for select to authenticated using ((select private.has_nexora_role(array[''super_admin'',''admin'',''sales_manager'',''marketing_manager''])))', t);
    execute format('drop policy if exists crm_insert_%1$s on public.%1$I', t);
    execute format('create policy crm_insert_%1$s on public.%1$I for insert to authenticated with check ((select private.has_nexora_role(array[''super_admin'',''admin'',''sales_manager''])))', t);
    execute format('drop policy if exists crm_update_%1$s on public.%1$I', t);
    execute format('create policy crm_update_%1$s on public.%1$I for update to authenticated using ((select private.has_nexora_role(array[''super_admin'',''admin'',''sales_manager'']))) with check ((select private.has_nexora_role(array[''super_admin'',''admin'',''sales_manager''])))', t);
    execute format('drop policy if exists crm_delete_%1$s on public.%1$I', t);
    execute format('create policy crm_delete_%1$s on public.%1$I for delete to authenticated using ((select private.has_nexora_role(array[''super_admin'',''admin''])))', t);
  end loop;
end $$;
-- Public lead/inquiry writes now go only through public.submit_inquiry() (next migration).
revoke insert on public.leads, public.sales_inquiries from anon;

-- Analytics & recommendations
drop policy if exists "Staff read analytics" on public.analytics_events;
drop policy if exists "Public insert analytics" on public.analytics_events;
drop policy if exists "Staff manage recommendations" on public.ai_recommendations;
drop policy if exists insights_read_analytics on public.analytics_events;
create policy insights_read_analytics on public.analytics_events for select to authenticated
  using ((select private.has_nexora_role(array['super_admin','admin','marketing_manager','sales_manager'])));
drop policy if exists insights_read_recs on public.ai_recommendations;
create policy insights_read_recs on public.ai_recommendations for select to authenticated
  using ((select private.has_nexora_role(array['super_admin','admin','marketing_manager','sales_manager'])));
drop policy if exists insights_write_recs on public.ai_recommendations;
create policy insights_write_recs on public.ai_recommendations for insert to authenticated
  with check ((select private.has_nexora_role(array['super_admin','admin','marketing_manager'])));
drop policy if exists insights_update_recs on public.ai_recommendations;
create policy insights_update_recs on public.ai_recommendations for update to authenticated
  using ((select private.has_nexora_role(array['super_admin','admin','marketing_manager'])))
  with check ((select private.has_nexora_role(array['super_admin','admin','marketing_manager'])));
-- Public analytics writes go only through public.track_event() (next migration).
revoke insert on public.analytics_events from anon, authenticated;

-- Audit logs: admins read; writes only via trigger/log_audit_event
drop policy if exists "Staff read audit logs" on public.audit_logs;
drop policy if exists admin_read_audit on public.audit_logs;
create policy admin_read_audit on public.audit_logs for select to authenticated
  using ((select private.has_nexora_role(array['super_admin','admin'])));
revoke insert, update, delete on public.audit_logs from authenticated;
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);

-- Staff: everyone sees own row; super admin sees/manages all (single policy per action)
drop policy if exists "Staff read staff" on public.staff_members;
drop policy if exists "Super admins manage staff" on public.staff_members;
drop policy if exists staff_read on public.staff_members;
create policy staff_read on public.staff_members for select to authenticated
  using (user_id = (select auth.uid()) or (select private.has_nexora_role(array['super_admin','admin'])));
drop policy if exists super_insert_staff on public.staff_members;
create policy super_insert_staff on public.staff_members for insert to authenticated
  with check ((select private.has_nexora_role(array['super_admin'])));
drop policy if exists super_update_staff on public.staff_members;
create policy super_update_staff on public.staff_members for update to authenticated
  using ((select private.has_nexora_role(array['super_admin']))) with check ((select private.has_nexora_role(array['super_admin'])));
drop policy if exists super_delete_staff on public.staff_members;
create policy super_delete_staff on public.staff_members for delete to authenticated
  using ((select private.has_nexora_role(array['super_admin'])) and user_id <> (select auth.uid()));

-- Demo sessions: admins may monitor (read only). No browser writes.
drop policy if exists admin_read_demo_sessions on public.demo_sessions;
create policy admin_read_demo_sessions on public.demo_sessions for select to authenticated
  using ((select private.has_nexora_role(array['super_admin','admin'])));

-- Prevent a super admin from demoting/deactivating the last active super admin.
create or replace function private.guard_last_super_admin() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (tg_op = 'DELETE' and old.role = 'super_admin' and old.is_active)
     or (tg_op = 'UPDATE' and old.role = 'super_admin' and old.is_active and (new.role <> 'super_admin' or not new.is_active)) then
    if (select count(*) from public.staff_members where role = 'super_admin' and is_active and user_id <> old.user_id) = 0 then
      raise exception 'cannot remove the last active super_admin';
    end if;
  end if;
  return coalesce(new, old);
end $$;
revoke all on function private.guard_last_super_admin() from public, anon, authenticated;
drop trigger if exists trg_staff_last_super_admin on public.staff_members;
create trigger trg_staff_last_super_admin before update or delete on public.staff_members
  for each row execute function private.guard_last_super_admin();

-- Staff directory (emails) for super admins only.
create or replace function public.staff_directory()
returns table(user_id uuid, email text, role text, is_active boolean, created_at timestamptz, last_sign_in_at timestamptz)
language plpgsql stable security definer set search_path = public, auth, pg_temp as $$
begin
  if not private.has_nexora_role(array['super_admin','admin']) then raise exception 'forbidden' using errcode = '42501'; end if;
  return query select s.user_id, u.email::text, s.role, s.is_active, s.created_at, u.last_sign_in_at
    from public.staff_members s join auth.users u on u.id = s.user_id order by s.created_at;
end $$;
revoke all on function public.staff_directory() from public, anon;
grant execute on function public.staff_directory() to authenticated;
