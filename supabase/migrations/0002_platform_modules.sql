-- NEXORA DIGITAL platform modules. Apply only to a dedicated development project.
create extension if not exists pgcrypto;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin','admin','marketing_manager','sales_manager','content_editor')),
  created_at timestamptz not null default now()
);

create or replace function public.is_staff(allowed_roles text[] default array['super_admin','admin'])
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = any(allowed_roles));
$$;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  phone text,
  interest text,
  message text not null,
  source text not null default 'website',
  status text not null default 'new' check (status in ('new','contacted','qualified','negotiation','proposal_sent','won','lost')),
  marketing_consent boolean not null default false,
  consented_at timestamptz,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  activity_type text not null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.demo_policies (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references public.products(id) on delete cascade,
  enabled boolean not null default false,
  duration_seconds integer not null default 420 check (duration_seconds between 300 and 600),
  idle_timeout_seconds integer not null default 90 check (idle_timeout_seconds between 30 and 300),
  max_active_sessions_per_visitor integer not null default 1 check (max_active_sessions_per_visitor between 1 and 3),
  watermark_text text not null default 'NEXORA DIGITAL · DEMO ONLY',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.demo_sessions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  token_hash text not null unique,
  visitor_hash text not null,
  status text not null default 'active' check (status in ('active','expired','revoked','completed')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_activity_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.demo_activity_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.demo_sessions(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.pricing_packages (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  name text not null,
  description text,
  price_amount numeric(14,2),
  currency text not null default 'IDR',
  billing_period text check (billing_period is null or billing_period in ('one_time','monthly','yearly','custom')),
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_integrations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  integration_type text not null check (integration_type in ('direct_url','iframe','api','sso')),
  application_url text,
  demo_url text,
  health_status text not null default 'unknown' check (health_status in ('unknown','healthy','degraded','offline')),
  last_checked_at timestamptz,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  product_id uuid references public.products(id) on delete set null,
  anonymous_id text,
  session_id text,
  source text,
  path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.content_projects (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  title text not null,
  objective text,
  channel text,
  tone text,
  status text not null default 'draft' check (status in ('draft','in_review','approved','published','archived')),
  brief jsonb not null default '{}'::jsonb,
  generated_copy text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.content_projects(id) on delete cascade,
  asset_type text not null check (asset_type in ('image','video','document','audio')),
  storage_path text not null,
  mime_type text,
  width integer,
  height integer,
  duration_seconds numeric(10,2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.content_calendar (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.content_projects(id) on delete set null,
  title text not null,
  channel text not null,
  scheduled_at timestamptz,
  status text not null default 'planned' check (status in ('planned','producing','review','scheduled','published','cancelled')),
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  recommendation_type text not null,
  title text not null,
  body text not null,
  evidence jsonb not null default '{}'::jsonb,
  confidence numeric(4,3),
  status text not null default 'suggested' check (status in ('suggested','accepted','dismissed','completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_created on public.leads(created_at desc);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_demo_sessions_expiry on public.demo_sessions(status, expires_at);
create index if not exists idx_demo_sessions_visitor on public.demo_sessions(visitor_hash, status);
create index if not exists idx_analytics_created on public.analytics_events(created_at desc);
create index if not exists idx_analytics_event on public.analytics_events(event_name, created_at desc);
create index if not exists idx_content_projects_product on public.content_projects(product_id, created_at desc);

-- RLS is enabled on every operational table. Public writes go through validated server routes using service-role credentials.
do $$ declare t text; begin
  foreach t in array array['user_roles','leads','lead_activities','demo_policies','demo_sessions','demo_activity_logs','pricing_packages','product_integrations','analytics_events','content_projects','content_assets','content_calendar','ai_recommendations','audit_logs'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Admin policies. Service-role backend operations bypass RLS; authenticated staff receive scoped access.
create policy "Staff can read leads" on public.leads for select to authenticated using (public.is_staff(array['super_admin','admin','sales_manager','marketing_manager']));
create policy "Staff can update leads" on public.leads for update to authenticated using (public.is_staff(array['super_admin','admin','sales_manager'])) with check (public.is_staff(array['super_admin','admin','sales_manager']));
create policy "Staff can read lead activities" on public.lead_activities for select to authenticated using (public.is_staff(array['super_admin','admin','sales_manager','marketing_manager']));
create policy "Staff can manage demo policies" on public.demo_policies for all to authenticated using (public.is_staff(array['super_admin','admin'])) with check (public.is_staff(array['super_admin','admin']));
create policy "Staff can read demo sessions" on public.demo_sessions for select to authenticated using (public.is_staff(array['super_admin','admin']));
create policy "Staff can read integrations" on public.product_integrations for select to authenticated using (public.is_staff(array['super_admin','admin']));
create policy "Admins can manage integrations" on public.product_integrations for all to authenticated using (public.is_staff(array['super_admin','admin'])) with check (public.is_staff(array['super_admin','admin']));
create policy "Staff can read analytics" on public.analytics_events for select to authenticated using (public.is_staff(array['super_admin','admin','marketing_manager']));
create policy "Staff can read content" on public.content_projects for select to authenticated using (public.is_staff(array['super_admin','admin','marketing_manager','content_editor']));
create policy "Content team can manage content" on public.content_projects for all to authenticated using (public.is_staff(array['super_admin','admin','marketing_manager','content_editor'])) with check (public.is_staff(array['super_admin','admin','marketing_manager','content_editor']));
create policy "Content team can manage assets" on public.content_assets for all to authenticated using (public.is_staff(array['super_admin','admin','marketing_manager','content_editor'])) with check (public.is_staff(array['super_admin','admin','marketing_manager','content_editor']));
create policy "Content team can manage calendar" on public.content_calendar for all to authenticated using (public.is_staff(array['super_admin','admin','marketing_manager','content_editor'])) with check (public.is_staff(array['super_admin','admin','marketing_manager','content_editor']));
create policy "Staff can read recommendations" on public.ai_recommendations for select to authenticated using (public.is_staff(array['super_admin','admin','marketing_manager']));
create policy "Admins can read audit logs" on public.audit_logs for select to authenticated using (public.is_staff(array['super_admin','admin']));
create policy "Users can read own role" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- Seed initial categories and product records. These are draft catalog entries until reviewed and published.
insert into public.product_categories(name,slug,description,sort_order) values
('Business Management','business-management','Business operations and ERP products.',1),
('Marketing Technology','marketing-technology','Marketing operations and CRM products.',2),
('Education Technology','education-technology','Learning and education administration products.',3),
('AI & Productivity','ai-productivity','AI-assisted productivity and content tools.',4)
on conflict(slug) do nothing;

insert into public.products(category_id,name,slug,short_description,description,status,publication_status,pricing_model,is_featured)
select c.id,v.name,v.slug,v.short_description,v.description,v.status,'draft',v.pricing_model,v.featured
from (values
('Waroeng Suramadu ERP','waroeng-suramadu-erp','Restaurant operations from POS to inventory and finance.','Integrated restaurant management system.','prototype','hybrid',true),
('Marcom Command Center','marcom-command-center','Campaign, CRM, KPI, branch and marketing operations.','Integrated marketing management workspace.','development','hybrid',true),
('EDU ADMIN','edu-admin','Teacher administration and learning preparation workspace.','Education administration application.','prototype','hybrid',false),
('EDUCLASS','educlass','Learning ecosystem for students, teachers and parents.','Learning management platform.','development','saas',true),
('AI Content Repurposing Studio','ai-content-studio','Repurpose content into multiple publication formats.','AI-assisted content production workspace.','planning','saas',false)
) as v(name,slug,short_description,description,status,pricing_model,featured)
join public.product_categories c on c.slug=case when v.slug='waroeng-suramadu-erp' then 'business-management' when v.slug='marcom-command-center' then 'marketing-technology' when v.slug in ('edu-admin','educlass') then 'education-technology' else 'ai-productivity' end
on conflict(slug) do nothing;

-- Extend lead consent so request-response consent is distinct from optional marketing consent.
alter table public.leads add column if not exists privacy_consent boolean not null default false;
alter table public.leads add column if not exists privacy_consented_at timestamptz;

-- Staff catalog permissions. Public catalog remains read-only for published products.
create policy "Staff can manage product categories" on public.product_categories for all to authenticated using (public.is_staff(array['super_admin','admin'])) with check (public.is_staff(array['super_admin','admin']));
create policy "Staff can manage products" on public.products for all to authenticated using (public.is_staff(array['super_admin','admin'])) with check (public.is_staff(array['super_admin','admin']));
create policy "Staff can manage product features" on public.product_features for all to authenticated using (public.is_staff(array['super_admin','admin'])) with check (public.is_staff(array['super_admin','admin']));
create policy "Staff can manage product media" on public.product_media for all to authenticated using (public.is_staff(array['super_admin','admin'])) with check (public.is_staff(array['super_admin','admin']));
create policy "Staff can manage pricing packages" on public.pricing_packages for all to authenticated using (public.is_staff(array['super_admin','admin','sales_manager'])) with check (public.is_staff(array['super_admin','admin','sales_manager']));
create policy "Staff can read demo activity logs" on public.demo_activity_logs for select to authenticated using (public.is_staff(array['super_admin','admin']));
create policy "Admins can write audit logs" on public.audit_logs for insert to authenticated with check (public.is_staff(array['super_admin','admin']));

-- Private bucket for content assets. Product images can be published only via explicitly public product_media records.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('nexora-content','nexora-content',false,52428800,array['image/png','image/jpeg','image/webp','video/mp4','video/webm','application/pdf'])
on conflict(id) do nothing;
create policy "Content team can read private content assets" on storage.objects for select to authenticated using (bucket_id='nexora-content' and public.is_staff(array['super_admin','admin','marketing_manager','content_editor']));
create policy "Content team can upload private content assets" on storage.objects for insert to authenticated with check (bucket_id='nexora-content' and public.is_staff(array['super_admin','admin','marketing_manager','content_editor']));
create policy "Content team can update private content assets" on storage.objects for update to authenticated using (bucket_id='nexora-content' and public.is_staff(array['super_admin','admin','marketing_manager','content_editor'])) with check (bucket_id='nexora-content' and public.is_staff(array['super_admin','admin','marketing_manager','content_editor']));
create policy "Admins can delete private content assets" on storage.objects for delete to authenticated using (bucket_id='nexora-content' and public.is_staff(array['super_admin','admin']));

insert into public.demo_policies(product_id)
select id from public.products
on conflict(product_id) do nothing;
