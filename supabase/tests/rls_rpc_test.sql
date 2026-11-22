-- NEXORA DIGITAL — RLS, RBAC and RPC acceptance tests.
-- Safe to run against the live project: everything runs in ONE transaction that always ends
-- in an exception ("ALL_TESTS_PASSED" or the first failure), so all changes are rolled back.
-- Run: paste into SQL editor / execute_sql. Expected final error message: ALL_TESTS_PASSED
begin;

-- ---------------------------------------------------------------- fixtures (as postgres)
create temporary table t_ids(k text primary key, v uuid) on commit drop;
grant select on t_ids to anon, authenticated, service_role;
insert into t_ids values
 ('nonstaff', gen_random_uuid()), ('sales', gen_random_uuid()), ('content', gen_random_uuid()),
 ('marketing', gen_random_uuid()), ('admin', gen_random_uuid()), ('super', gen_random_uuid()),
 ('cat', gen_random_uuid()), ('prod', gen_random_uuid());
insert into auth.users(id, instance_id, aud, role, email, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
select v, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-' || k || '@nexora-test.invalid', now(), now(), now(), '{}', '{}'
from t_ids where k in ('nonstaff','sales','content','marketing','admin','super');
insert into public.staff_members(user_id, role) select v, case k when 'sales' then 'sales_manager' when 'content' then 'content_editor' when 'marketing' then 'marketing_manager' when 'admin' then 'admin' else 'super_admin' end
from t_ids where k in ('sales','content','marketing','admin','super');
insert into public.product_categories(id, name, slug) values ((select v from t_ids where k='cat'), 'RLS Test Category', 'rls-test-category');
insert into public.products(id, category_id, name, slug, status, publication_status, verified_at, demo_enabled)
values ((select v from t_ids where k='prod'), (select v from t_ids where k='cat'), 'RLS Test Product', 'rls-test-product', 'ready_for_demo', 'published', now(), true);
insert into public.demo_policies(product_id, enabled, duration_minutes, idle_timeout_seconds, max_active_sessions, max_concurrent_sessions)
values ((select v from t_ids where k='prod'), true, 7, 90, 1, 10);
create temporary table t_demo(k text primary key, sid uuid, token text) on commit drop;
grant select, insert on t_demo to anon, authenticated;

create or replace function pg_temp.as_user(p_key text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('sub', (select v from t_ids where k = p_key), 'role', 'authenticated')::text, true); end $$;

-- ---------------------------------------------------------------- 1. anonymous visitor
set local role anon;
do $$
declare n int; r jsonb; ok boolean;
begin
  select count(*) into n from public.products where publication_status <> 'published';
  if n <> 0 then raise exception 'FAIL anon sees % unpublished products', n; end if;
  select count(*) into n from public.products where slug = 'rls-test-product';
  if n <> 1 then raise exception 'FAIL anon cannot see published product'; end if;
  select count(*) into n from public.product_categories where slug = 'rls-test-category';
  if n <> 1 then raise exception 'FAIL anon cannot see category of published product'; end if;

  begin perform 1 from public.leads limit 1; raise exception 'FAIL anon read leads';
  exception when insufficient_privilege then null; end;
  begin insert into public.leads(full_name, email) values ('Spam', 'x@y.zz'); raise exception 'FAIL anon direct lead insert';
  exception when insufficient_privilege then null; end;
  begin insert into public.analytics_events(event_name) values ('page_view'); raise exception 'FAIL anon direct analytics insert';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.demo_sessions limit 1; raise exception 'FAIL anon read demo_sessions';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.audit_logs limit 1; raise exception 'FAIL anon read audit_logs';
  exception when insufficient_privilege then null; end;
  begin perform public.staff_directory(); raise exception 'FAIL anon staff_directory';
  exception when insufficient_privilege then null; end;
  begin perform public.claim_render_job('x'); raise exception 'FAIL anon claim_render_job';
  exception when insufficient_privilege then null; end;

  -- inquiry RPC validation
  begin perform public.submit_inquiry('{"full_name":"Budi","email":"budi@example.com","message":"Need an ERP for 3 branches"}');
    raise exception 'FAIL inquiry without consent accepted';
  exception when raise_exception then if sqlerrm <> 'consent_required' then raise; end if; end;
  begin perform public.submit_inquiry('{"full_name":"Budi","email":"not-an-email","message":"Need an ERP for 3 branches","privacy_consent":true}');
    raise exception 'FAIL invalid email accepted';
  exception when raise_exception then if sqlerrm <> 'invalid_email' then raise; end if; end;
  r := public.submit_inquiry('{"full_name":"Budi Test","email":"Budi.RLS@example.com","company":"PT Uji","phone":"+62 811 000","message":"We need a quotation for an ERP for three restaurant branches with inventory.","inquiry_type":"quotation","source":"quote","product_slug":"rls-test-product","privacy_consent":true}');
  if r->>'ok' <> 'true' or r ? 'id' then raise exception 'FAIL submit_inquiry result %', r; end if;
  r := public.submit_inquiry('{"website":"http://spam","full_name":"Bot","email":"bot@example.com","message":"spam spam spam spam","privacy_consent":true}');
  if r->>'ok' <> 'true' then raise exception 'FAIL honeypot'; end if;
  perform public.submit_inquiry('{"full_name":"Budi Test","email":"budi.rls@example.com","message":"Second message about the ERP","privacy_consent":true}');
  perform public.submit_inquiry('{"full_name":"Budi Test","email":"budi.rls@example.com","message":"Third message about the ERP","privacy_consent":true}');
  begin perform public.submit_inquiry('{"full_name":"Budi Test","email":"budi.rls@example.com","message":"Fourth message about the ERP","privacy_consent":true}');
    raise exception 'FAIL email rate limit not enforced';
  exception when raise_exception then if sqlerrm <> 'rate_limited' then raise; end if; end;

  -- analytics RPC
  ok := public.track_event('page_view', '/products?email=leak@example.com', null, repeat('a', 64), 'website', '{}');
  if not ok then raise exception 'FAIL track_event'; end if;
  begin perform public.track_event('demo_started'); raise exception 'FAIL forged demo_started accepted';
  exception when raise_exception then if sqlerrm <> 'invalid_event' then raise; end if; end;

  -- demo engine
  begin perform public.demo_start('waroeng-suramadu-erp', repeat('b', 64)); raise exception 'FAIL demo on draft product';
  exception when raise_exception then if sqlerrm <> 'demo_unavailable' then raise; end if; end;
  r := public.demo_start('rls-test-product', repeat('b', 64));
  if r->>'token' !~ '^[a-f0-9]{64}$' or (r->>'duration_seconds')::int <> 420 or (r->>'idle_timeout_seconds')::int <> 90 then raise exception 'FAIL demo_start payload %', r; end if;
  insert into t_demo values ('a', (r->>'session_id')::uuid, r->>'token');
  begin perform public.demo_start('rls-test-product', repeat('b', 64)); raise exception 'FAIL one-session-per-visitor';
  exception when raise_exception then if sqlerrm <> 'active_session_exists' then raise; end if; end;
  r := public.demo_heartbeat((select sid from t_demo where k='a'), repeat('0', 64), true);
  if r->>'status' <> 'invalid' then raise exception 'FAIL wrong token accepted'; end if;
  r := public.demo_heartbeat((select sid from t_demo where k='a'), (select token from t_demo where k='a'), true);
  if r->>'status' <> 'active' or (r->>'remaining_seconds')::int not between 400 and 420 then raise exception 'FAIL heartbeat active %', r; end if;
  r := public.demo_start('rls-test-product', repeat('c', 64));
  insert into t_demo values ('b', (r->>'session_id')::uuid, r->>'token');
  r := public.demo_heartbeat((select sid from t_demo where k='b'), (select token from t_demo where k='a'), true);
  if r->>'status' <> 'invalid' then raise exception 'FAIL cross-session token accepted'; end if;
end $$;
reset role;

-- server-side tampering simulation: duration over / idle over (browser clock is irrelevant)
update public.demo_sessions set expires_at = now() - interval '1 second' where id = (select sid from t_demo where k='a');
update public.demo_sessions set last_seen_at = now() - interval '91 seconds' where id = (select sid from t_demo where k='b');

set local role anon;
do $$ declare r jsonb; begin
  r := public.demo_heartbeat((select sid from t_demo where k='a'), (select token from t_demo where k='a'), true);
  if r->>'status' <> 'expired' or r->>'reason' <> 'duration' then raise exception 'FAIL expired session accepted %', r; end if;
  r := public.demo_heartbeat((select sid from t_demo where k='a'), (select token from t_demo where k='a'), true);
  if r->>'status' <> 'expired' then raise exception 'FAIL expired session revived %', r; end if;
  r := public.demo_heartbeat((select sid from t_demo where k='b'), (select token from t_demo where k='b'), true);
  if r->>'status' <> 'expired' or r->>'reason' <> 'idle' then raise exception 'FAIL idle session accepted %', r; end if;
  if (public.demo_end((select sid from t_demo where k='b'), (select token from t_demo where k='b')))->>'ok' <> 'false' then raise exception 'FAIL end of expired session'; end if;
  r := public.demo_start('rls-test-product', repeat('b', 64)); -- previous one expired → allowed again
  if (public.demo_end((r->>'session_id')::uuid, r->>'token'))->>'ok' <> 'true' then raise exception 'FAIL demo_end'; end if;
end $$;
reset role;

do $$ declare n int; begin
  select count(*) into n from public.leads where email = 'budi.rls@example.com' and privacy_consent and score >= 60 and status = 'new';
  if n <> 1 then raise exception 'FAIL lead not stored once with consent/score (n=%)', n; end if;
  select count(*) into n from public.sales_inquiries si join public.leads l on l.id = si.lead_id where l.email = 'budi.rls@example.com' and si.inquiry_type = 'quotation';
  if n <> 1 then raise exception 'FAIL quotation inquiry missing'; end if;
  select count(*) into n from public.leads where email = 'bot@example.com';
  if n <> 0 then raise exception 'FAIL honeypot stored'; end if;
  select count(*) into n from public.analytics_events where path = '/products';
  if n <> 1 then raise exception 'FAIL query string not stripped from analytics path'; end if;
  select count(*) into n from public.demo_session_events e join t_demo d on d.sid = e.session_id where e.event_type in ('expired','idle_timeout');
  if n < 2 then raise exception 'FAIL demo expiry events not logged'; end if;
end $$;

-- ---------------------------------------------------------------- 2. authenticated non-staff
set local role authenticated;
select pg_temp.as_user('nonstaff');
do $$ declare n int; begin
  select count(*) into n from public.products where publication_status <> 'published';
  if n <> 0 then raise exception 'FAIL non-staff sees drafts'; end if;
  select count(*) into n from public.leads; if n <> 0 then raise exception 'FAIL non-staff reads leads'; end if;
  select count(*) into n from public.audit_logs; if n <> 0 then raise exception 'FAIL non-staff reads audit'; end if;
  select count(*) into n from public.staff_members; if n <> 0 then raise exception 'FAIL non-staff reads staff'; end if;
  begin insert into public.products(name, slug) values ('X', 'x-hack'); raise exception 'FAIL non-staff inserts product';
  exception when insufficient_privilege then null; end;
  begin insert into public.staff_members(user_id, role) values ((select v from t_ids where k='nonstaff'), 'super_admin'); raise exception 'FAIL self-escalation';
  exception when insufficient_privilege then null; end;
  begin perform public.grant_staff_role('rls-test-nonstaff@nexora-test.invalid', 'admin'); raise exception 'FAIL non-staff grant role';
  exception when insufficient_privilege then null; end;
end $$;

-- ---------------------------------------------------------------- 3. content editor
select pg_temp.as_user('content');
do $$ declare n int; v_proj uuid; v_job uuid; begin
  select count(*) into n from public.products where publication_status = 'draft';
  if n < 5 then raise exception 'FAIL content editor cannot see drafts'; end if;
  select count(*) into n from public.leads; if n <> 0 then raise exception 'FAIL content editor reads leads'; end if;
  update public.products set name = name || 'x' where slug = 'rls-test-product'; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL content editor updates product'; end if;
  insert into public.product_features(product_id, title) values ((select v from t_ids where k='prod'), 'Feature by editor');
  insert into public.content_projects(title, content_type, product_id) values ('Launch post', 'social_post', (select v from t_ids where k='prod')) returning id into v_proj;
  begin update public.content_projects set status = 'approved' where id = v_proj; raise exception 'FAIL editor approves content';
  exception when insufficient_privilege then null; end;
  insert into public.render_jobs(content_project_id, job_type, output_format, width, height, duration_seconds, template_key, requested_by)
  values (v_proj, 'video', 'mp4', 1080, 1920, 15, 'product-launch', (select v from t_ids where k='content')) returning id into v_job;
  begin update public.render_jobs set status = 'completed', progress = 100 where id = v_job; raise exception 'FAIL editor fakes completed job';
  exception when insufficient_privilege then null; end;
  update public.render_jobs set status = 'canceled' where id = v_job;
  update public.render_jobs set status = 'queued' where id = v_job;
  begin insert into public.render_jobs(job_type, output_format, width, height, template_key, requested_by, status)
    values ('image','png',1080,1080,'x1',(select v from t_ids where k='content'),'completed'); raise exception 'FAIL insert completed job';
  exception when insufficient_privilege then null; end;
  select count(*) into n from public.analytics_events; if n <> 0 then raise exception 'FAIL content editor reads analytics'; end if;
end $$;

-- ---------------------------------------------------------------- 4. sales manager
select pg_temp.as_user('sales');
do $$ declare n int; v_lead uuid; v_inq uuid; begin
  select id into v_lead from public.leads where email = 'budi.rls@example.com';
  if v_lead is null then raise exception 'FAIL sales cannot read leads'; end if;
  update public.leads set status = 'contacted', owner_id = (select v from t_ids where k='sales') where id = v_lead;
  select count(*) into n from public.lead_activities where lead_id = v_lead and activity_type = 'status_change' and metadata->>'to' = 'contacted';
  if n <> 1 then raise exception 'FAIL status change not on timeline'; end if;
  insert into public.lead_activities(lead_id, activity_type, notes, created_by) values (v_lead, 'call', 'Discussed scope', (select v from t_ids where k='sales'));
  select id into v_inq from public.sales_inquiries where lead_id = v_lead;
  update public.sales_inquiries set status = 'pending_approval', quoted_amount = 25000000 where id = v_inq;
  begin update public.sales_inquiries set status = 'approved' where id = v_inq; raise exception 'FAIL sales approves own quote';
  exception when insufficient_privilege then null; end;
  begin update public.sales_inquiries set status = 'sent' where id = v_inq; raise exception 'FAIL unapproved quote sent';
  exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
  select count(*) into n from public.audit_logs; if n <> 0 then raise exception 'FAIL sales reads audit logs'; end if;
  begin insert into public.products(name, slug) values ('X', 'x-sales'); raise exception 'FAIL sales inserts product';
  exception when insufficient_privilege then null; end;
  select count(*) into n from public.analytics_events; if n < 1 then raise exception 'FAIL sales cannot read analytics'; end if;
end $$;

-- ---------------------------------------------------------------- 5. marketing manager
select pg_temp.as_user('marketing');
do $$ declare n int; begin
  select count(*) into n from public.leads; if n < 1 then raise exception 'FAIL marketing cannot read leads'; end if;
  update public.leads set status = 'won' where email = 'budi.rls@example.com'; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL marketing updates leads'; end if;
  update public.content_projects set status = 'approved' where title = 'Launch post'; get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL marketing cannot approve content'; end if;
  select count(*) into n from public.content_projects where title = 'Launch post' and approved_by = (select v from t_ids where k='marketing');
  if n <> 1 then raise exception 'FAIL approver not stamped'; end if;
  if (public.analytics_overview(30)->>'total_events')::int < 1 then raise exception 'FAIL analytics_overview'; end if;
end $$;

-- ---------------------------------------------------------------- 6. admin
select pg_temp.as_user('admin');
do $$ declare n int; v_inq uuid; begin
  select si.id into v_inq from public.sales_inquiries si join public.leads l on l.id = si.lead_id where l.email = 'budi.rls@example.com';
  update public.sales_inquiries set status = 'approved' where id = v_inq;
  select count(*) into n from public.sales_inquiries where id = v_inq and approved_by = (select v from t_ids where k='admin') and approved_at is not null;
  if n <> 1 then raise exception 'FAIL admin approval not stamped'; end if;
  update public.sales_inquiries set status = 'sent' where id = v_inq;
  select count(*) into n from public.audit_logs where entity_type = 'sales_inquiries' and entity_id = v_inq;
  if n < 3 then raise exception 'FAIL audit trail for quotation (n=%)', n; end if;
  select count(*) into n from public.audit_logs where entity_type = 'products' and action = 'insert';
  if n < 1 then raise exception 'FAIL product insert not audited'; end if;
  begin insert into public.staff_members(user_id, role) values ((select v from t_ids where k='nonstaff'), 'admin'); raise exception 'FAIL admin manages staff';
  exception when insufficient_privilege then null; end;
  select count(*) into n from public.staff_directory(); if n < 6 then raise exception 'FAIL staff_directory for admin'; end if;
  select count(*) into n from public.demo_sessions; if n < 3 then raise exception 'FAIL admin cannot monitor demo sessions'; end if;
  begin update public.products set publication_status = 'published' where slug = 'waroeng-suramadu-erp'; raise exception 'FAIL publish without verification';
  exception when check_violation then null; end;
  begin update public.products set demo_enabled = true where slug = 'edu-admin'; raise exception 'FAIL demo enabled on draft';
  exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
  perform public.log_audit_event('lead_export', 'leads', null, '{"rows":1}');
end $$;

-- ---------------------------------------------------------------- 7. super admin
select pg_temp.as_user('super');
do $$ declare n int; begin
  perform public.grant_staff_role('rls-test-nonstaff@nexora-test.invalid', 'content_editor');
  select count(*) into n from public.staff_members where user_id = (select v from t_ids where k='nonstaff') and role = 'content_editor';
  if n <> 1 then raise exception 'FAIL grant_staff_role'; end if;
  delete from public.staff_members where user_id = (select v from t_ids where k='super'); get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL super admin deleted own staff row'; end if;
end $$;
reset role;

-- ---------------------------------------------------------------- 8. render worker (service_role)
set local role service_role;
do $$ declare j public.render_jobs; v_asset uuid; begin
  j := public.claim_render_job('test-worker');
  if j.id is null or j.status <> 'processing' then raise exception 'FAIL claim_render_job'; end if;
  begin perform public.complete_render_job(j.id, 'test-worker', 'renders/x.mp4', 'video/mp4', 1000, 1080, 1080, 15, 'abc');
    raise exception 'FAIL wrong dimensions accepted';
  exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
  v_asset := public.complete_render_job(j.id, 'test-worker', 'renders/x.mp4', 'video/mp4', 1000, 1080, 1920, 15, 'abc');
  if v_asset is null then raise exception 'FAIL complete_render_job'; end if;
end $$;
reset role;

do $$ begin raise exception 'ALL_TESTS_PASSED'; end $$;
