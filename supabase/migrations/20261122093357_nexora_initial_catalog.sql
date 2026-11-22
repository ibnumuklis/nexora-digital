-- Copied verbatim from live supabase_migrations.schema_migrations (version 20261122093357).
-- ALREADY APPLIED to project ijkazeukjooauwsvwtiq. Never edit.
create extension if not exists pgcrypto;
create table if not exists public.product_categories (
 id uuid primary key default gen_random_uuid(),
 name text not null, slug text not null unique, description text,
 sort_order integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.products (
 id uuid primary key default gen_random_uuid(),
 category_id uuid references public.product_categories(id) on delete set null,
 name text not null, slug text not null unique, short_description text, description text,
 status text not null default 'planning' check (status in ('planning','prototype','development','beta','ready_for_demo','available','maintenance','discontinued')),
 publication_status text not null default 'draft' check (publication_status in ('draft','published','archived')),
 logo_path text, application_url text, demo_url text,
 pricing_model text check (pricing_model is null or pricing_model in ('saas','lifetime_license','custom_development','maintenance','white_label','hybrid')),
 is_featured boolean not null default false, published_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.product_features (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.products(id) on delete cascade,
 title text not null, description text, sort_order integer not null default 0,
 created_at timestamptz not null default now()
);
create table if not exists public.product_media (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.products(id) on delete cascade,
 media_type text not null check (media_type in ('image','video','document')),
 storage_path text not null, alt_text text, is_public boolean not null default false,
 sort_order integer not null default 0, created_at timestamptz not null default now()
);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_publication on public.products(publication_status,status);
create index if not exists idx_product_features_product on public.product_features(product_id);
create index if not exists idx_product_media_product on public.product_media(product_id);
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_features enable row level security;
alter table public.product_media enable row level security;
create policy "Public can read published categories" on public.product_categories for select to anon,authenticated
using (exists(select 1 from public.products p where p.category_id=product_categories.id and p.publication_status='published'));
create policy "Public can read published products" on public.products for select to anon,authenticated using(publication_status='published');
create policy "Public can read features of published products" on public.product_features for select to anon,authenticated
using(exists(select 1 from public.products p where p.id=product_features.product_id and p.publication_status='published'));
create policy "Public can read public media of published products" on public.product_media for select to anon,authenticated
using(is_public=true and exists(select 1 from public.products p where p.id=product_media.product_id and p.publication_status='published'));
grant select on public.product_categories,public.products,public.product_features,public.product_media to anon,authenticated;
