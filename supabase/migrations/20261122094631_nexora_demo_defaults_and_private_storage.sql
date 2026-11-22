-- Copied verbatim from live supabase_migrations.schema_migrations (version 20261122094631).
-- ALREADY APPLIED to project ijkazeukjooauwsvwtiq. Never edit.
insert into public.demo_policies(product_id,enabled,duration_minutes,idle_timeout_seconds,max_active_sessions,watermark_text)
select id,false,7,90,1,'NEXORA DIGITAL · DEMO PREVIEW'
from public.products
on conflict(product_id) do nothing;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('nexora-assets','nexora-assets',false,52428800,array['image/png','image/jpeg','image/webp','video/mp4','video/webm','application/pdf'])
on conflict(id) do nothing;

create policy "Nexora staff can read private assets" on storage.objects
for select to authenticated using(bucket_id='nexora-assets' and private.is_nexora_staff());
create policy "Nexora content team can upload private assets" on storage.objects
for insert to authenticated with check(bucket_id='nexora-assets' and private.has_nexora_role(array['super_admin','admin','marketing_manager','content_editor']));
create policy "Nexora content team can update private assets" on storage.objects
for update to authenticated using(bucket_id='nexora-assets' and private.has_nexora_role(array['super_admin','admin','marketing_manager','content_editor']))
with check(bucket_id='nexora-assets' and private.has_nexora_role(array['super_admin','admin','marketing_manager','content_editor']));
create policy "Nexora admins can delete private assets" on storage.objects
for delete to authenticated using(bucket_id='nexora-assets' and private.has_nexora_role(array['super_admin','admin']));
