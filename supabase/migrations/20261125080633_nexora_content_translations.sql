-- APPLIED to live as version 20261125080633.
-- Additive: per-row translations for public content. Primary columns hold Bahasa Indonesia (default locale);
-- translations->'en' holds the English version of the same fields. Idempotent.
alter table public.products           add column if not exists translations jsonb not null default '{}'::jsonb;
alter table public.product_features   add column if not exists translations jsonb not null default '{}'::jsonb;
alter table public.pricing_packages   add column if not exists translations jsonb not null default '{}'::jsonb;
alter table public.product_categories add column if not exists translations jsonb not null default '{}'::jsonb;
alter table public.articles           add column if not exists translations jsonb not null default '{}'::jsonb;

do $$
declare t text;
begin
  foreach t in array array['products','product_features','pricing_packages','product_categories','articles'] loop
    if not exists (select 1 from pg_constraint where conname = t || '_translations_object' and conrelid = ('public.' || t)::regclass) then
      execute format('alter table public.%I add constraint %I check (jsonb_typeof(translations) = ''object'' and pg_column_size(translations) < 65536)', t, t || '_translations_object');
    end if;
  end loop;
end $$;

comment on column public.products.translations is 'Localized overrides keyed by locale, e.g. {"en": {"short_description": "..."}}. Primary columns are Bahasa Indonesia.';
