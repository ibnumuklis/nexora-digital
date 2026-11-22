-- Copied verbatim from live supabase_migrations.schema_migrations (version 20261122093434).
-- ALREADY APPLIED to project ijkazeukjooauwsvwtiq. Never edit.
revoke all on function public.is_nexora_staff() from public, anon;
revoke all on function public.has_nexora_role(text[]) from public, anon;
grant execute on function public.is_nexora_staff() to authenticated;
grant execute on function public.has_nexora_role(text[]) to authenticated;
create index if not exists idx_demo_sessions_product on public.demo_sessions(product_id);
create index if not exists idx_leads_product on public.leads(product_id);
create index if not exists idx_lead_activities_lead on public.lead_activities(lead_id);
create index if not exists idx_sales_inquiries_lead on public.sales_inquiries(lead_id);
create index if not exists idx_sales_inquiries_product on public.sales_inquiries(product_id);
create index if not exists idx_pricing_packages_product on public.pricing_packages(product_id);
create index if not exists idx_subscriptions_lead on public.subscriptions(lead_id);
create index if not exists idx_subscriptions_package on public.subscriptions(pricing_package_id);
create index if not exists idx_licenses_product on public.licenses(product_id);
create index if not exists idx_licenses_lead on public.licenses(lead_id);
create index if not exists idx_product_integrations_product on public.product_integrations(product_id);
create index if not exists idx_ai_recommendations_product on public.ai_recommendations(product_id);
create index if not exists idx_analytics_events_product on public.analytics_events(product_id);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_content_assets_project on public.content_assets(content_project_id);
create index if not exists idx_content_assets_product on public.content_assets(product_id);
create index if not exists idx_content_calendar_project on public.content_calendar(content_project_id);
create index if not exists idx_content_calendar_product on public.content_calendar(product_id);
create index if not exists idx_content_projects_product on public.content_projects(product_id);
create index if not exists idx_content_projects_creator on public.content_projects(created_by);
create index if not exists idx_testimonials_product on public.testimonials(product_id);
create index if not exists idx_lead_activities_creator on public.lead_activities(created_by);
