-- NEXORA DIGITAL — provisional product content (owner-approved 2026-11-22 as temporary data to be refined in Admin).
-- Based only on the product scope in the handoff package. No metrics, customers, certifications or prices invented.
-- Idempotent: updates existing rows; features/packages are inserted only when a product has none.
begin;

update public.product_categories set name = 'Business Management', description = 'Operations, inventory and finance systems for growing businesses.', sort_order = 1 where slug = 'business-management';
update public.product_categories set name = 'Marketing Technology', description = 'Campaign, CRM and reporting tools for marketing teams.', sort_order = 2 where slug = 'marketing-technology';
update public.product_categories set name = 'Education Technology', description = 'Administration and learning platforms for schools and teachers.', sort_order = 3 where slug = 'education-technology';
update public.product_categories set name = 'AI & Productivity', description = 'AI-assisted tools that speed up content and knowledge work.', sort_order = 4 where slug = 'artificial-intelligence';

-- 1. Waroeng Suramadu ERP
update public.products set
  category_id = (select id from public.product_categories where slug = 'business-management'),
  short_description = 'Restaurant operations in one system — from cashier and menu to stock, suppliers, cost of goods and finance.',
  problem_statement = 'Restaurants and cafés often run sales, stock, purchasing and cash on separate notebooks and spreadsheets, which makes cost of goods (HPP), margins and branch performance hard to see.',
  description = 'Waroeng Suramadu ERP is a restaurant operations system designed around the daily work of food & beverage outlets. It brings point of sale, menu and product data, inventory, suppliers, cost-of-goods planning, cash management, finance, customer insight, branches and user roles into one place so owners and managers can see what is happening in every outlet.

The product is currently at prototype stage. Modules and workflows are being refined with real restaurant operations; the delivered configuration is agreed per client.',
  target_market = 'Restaurants, cafés and multi-branch F&B businesses',
  benefits = array['One view of sales, stock and cash across outlets','Clearer cost of goods (HPP) and menu margins','Less manual recap work at the end of each shift','Role-based access for cashiers, managers and owners'],
  technology_stack = array['Web application','Cloud database'],
  pricing_model = 'custom_development',
  faq = '[{"q":"Is Waroeng Suramadu ERP ready to use today?","a":"It is at prototype stage. We can walk you through the current workflows and discuss a pilot or custom implementation for your outlets."},{"q":"Can it handle more than one branch?","a":"Multi-branch management is part of the product scope. Branch setup is configured during implementation."},{"q":"How is pricing determined?","a":"Pricing depends on the number of outlets, users, modules and support level. Request a quote for a tailored proposal."}]'::jsonb,
  seo_title = 'Waroeng Suramadu ERP — Restaurant POS, Inventory & Finance',
  seo_description = 'Restaurant ERP for cashier/POS, menu, inventory, suppliers, cost of goods (HPP), cash and branch management by NEXORA DIGITAL.'
where slug = 'waroeng-suramadu-erp';

-- 2. Marcom Command Center
update public.products set
  category_id = (select id from public.product_categories where slug = 'marketing-technology'),
  short_description = 'A command center for marketing teams: campaigns, CRM, branch activity, budgets, content workflow and KPI reporting.',
  problem_statement = 'Multi-branch marketing teams juggle campaign plans, customer data, branch reports and content approvals across chat groups and spreadsheets, so performance is hard to track and compare.',
  description = 'Marcom Command Center is a marketing operations workspace that connects campaign planning, customer and lead tracking, branch activity monitoring, KPI and budget follow-up, content workflows and reporting.

It is designed for marketing and communication teams that coordinate several branches or channels and need one source of truth. The product is in active development; features are prioritised together with pilot users.',
  target_market = 'Marketing & communication teams, retail and multi-branch businesses',
  benefits = array['Campaigns, budgets and results in one workspace','Branch activities monitored against plan','Lead and customer follow-up in a shared CRM','Faster reporting for management'],
  technology_stack = array['Web application','Cloud database'],
  pricing_model = 'custom_development',
  faq = '[{"q":"Who is Marcom Command Center for?","a":"Marketing and communication teams that manage campaigns, content and customer follow-up across several branches or channels."},{"q":"Can it be adapted to our workflow?","a":"Yes. It is delivered as a configurable product with custom development where needed."},{"q":"Is there a demo?","a":"A sandbox demo with sample data is available, and we can arrange a guided walkthrough."}]'::jsonb,
  seo_title = 'Marcom Command Center — Marketing Operations, CRM & KPI',
  seo_description = 'Marketing operations platform for campaigns, CRM, branch monitoring, budgets, content workflow and KPI reporting.'
where slug = 'marcom-command-center';

-- 3. EDU ADMIN
update public.products set
  category_id = (select id from public.product_categories where slug = 'education-technology'),
  short_description = 'Teaching administration made simpler: lesson plans, teaching documents, academic calendars and recaps in one workspace.',
  problem_statement = 'Teachers spend many hours preparing and re-formatting administrative documents — annual and semester programmes, lesson plans, effective-week analysis and journals — instead of teaching.',
  description = 'EDU ADMIN is a workspace for teachers and schools to prepare and organise teaching administration: learning tools (perangkat ajar), annual and semester programmes (Prota & Promes), effective-week analysis, teaching schedules, journals and administrative recaps for supervision.

The product is in development. Document formats follow common school practice and can be adjusted per school.',
  target_market = 'Teachers, schools and education institutions',
  benefits = array['Less time on repetitive administrative documents','Consistent formats across teachers and subjects','Documents ready for academic supervision','Everything stored in one place'],
  technology_stack = array['Web application','Cloud database'],
  pricing_model = 'saas',
  faq = '[{"q":"Which documents does EDU ADMIN cover?","a":"The scope includes learning tools, annual and semester programmes, effective-week analysis, schedules, journals and administrative recaps. Exact templates are confirmed during onboarding."},{"q":"Can a whole school use it?","a":"Yes — individual teacher use and school licences are both part of the plan."}]'::jsonb,
  seo_title = 'EDU ADMIN — Teaching Administration for Teachers & Schools',
  seo_description = 'Teacher administration workspace for lesson plans, Prota & Promes, effective-week analysis, schedules and recaps.'
where slug = 'edu-admin';

-- 4. EDUCLASS
update public.products set
  category_id = (select id from public.product_categories where slug = 'education-technology'),
  short_description = 'A learning platform connecting students, teachers, administrators and parents — materials, assignments, quizzes, schedules and results.',
  problem_statement = 'Learning materials, assignments, grades and communication with parents are often scattered across chat apps and paper, making progress hard to follow.',
  description = 'EDUCLASS is a learning management platform that brings students, teachers, school administrators and parents together. It covers learning materials, schedules, assignments and quizzes, learning results and progress, communication and a parent portal.

The product is in development. Payment-related features are only enabled when properly integrated and agreed with the institution.',
  target_market = 'Schools, tutoring centres, teachers, students and parents',
  benefits = array['Materials, tasks and schedules in one place','Learning progress visible to teachers and parents','Fewer scattered chat groups','Works on phones and computers'],
  technology_stack = array['Web application','Cloud database'],
  pricing_model = 'saas',
  faq = '[{"q":"Can parents follow their child''s progress?","a":"A parent portal is part of the product scope so parents can see schedules, assignments and results."},{"q":"Does EDUCLASS process payments?","a":"Not by default. Any payment feature is enabled only after a proper integration is agreed with the institution."}]'::jsonb,
  seo_title = 'EDUCLASS — Learning Platform for Schools, Students & Parents',
  seo_description = 'Learning management platform with materials, assignments, quizzes, schedules, results and a parent portal.'
where slug = 'educlass';

-- 5. AI Content Repurposing Studio
update public.products set
  category_id = (select id from public.product_categories where slug = 'artificial-intelligence'),
  short_description = 'Turn one idea or source material into captions, social posts, visual assets and short-video storyboards.',
  problem_statement = 'Creators and marketing teams need many content formats for every channel, and rewriting the same message by hand is slow and inconsistent.',
  description = 'AI Content Repurposing Studio is a content production workspace that helps turn a single source — an idea, article or product brief — into multiple publishing formats: captions and copy, social post designs, carousels and short-video storyboards, organised in a content planner and asset library.

The product is at prototype stage. AI-generated output is always presented as an editable draft for human review; the level of automation is described per feature as it becomes available.',
  target_market = 'Content creators, marketers and small businesses',
  benefits = array['One source, many channel-ready formats','Consistent brand voice across posts','Drafts for review instead of a blank page','Planner and asset library in one place'],
  technology_stack = array['Web application','AI-assisted generation'],
  pricing_model = 'saas',
  faq = '[{"q":"Does the AI publish content automatically?","a":"No. All generated content is a draft that you review and edit before publishing."},{"q":"Which formats are supported?","a":"The scope covers captions, social post designs, carousels and short-video storyboards. Availability of each format is confirmed as the prototype progresses."}]'::jsonb,
  seo_title = 'AI Content Repurposing Studio — One Idea, Many Formats',
  seo_description = 'AI-assisted workspace to repurpose source content into captions, social posts, carousels and video storyboards.'
where slug = 'ai-content-repurposing-studio';

-- Features (only if none exist yet)
insert into public.product_features(product_id, title, description, sort_order)
select p.id, f.title, f.description, f.ord from public.products p
join (values
  ('waroeng-suramadu-erp','POS & cashier','Record sales and payments at the counter.',10),
  ('waroeng-suramadu-erp','Menu & products','Manage menu items, variants and recipes.',20),
  ('waroeng-suramadu-erp','Inventory & suppliers','Track stock movement, purchasing and suppliers.',30),
  ('waroeng-suramadu-erp','Cost of goods (HPP) planning','Estimate recipe costs and menu margins.',40),
  ('waroeng-suramadu-erp','Cash & finance','Petty cash, cash flow and financial recaps.',50),
  ('waroeng-suramadu-erp','Branches & users','Outlet management with role-based access.',60),
  ('marcom-command-center','Campaign management','Plan campaigns, timelines and budgets.',10),
  ('marcom-command-center','CRM & lead tracking','Follow up customers and leads in one list.',20),
  ('marcom-command-center','Branch monitoring','Monitor marketing activities per branch.',30),
  ('marcom-command-center','KPI & budget','Track targets and spending against plan.',40),
  ('marcom-command-center','Content workflow','Brief, review and approve content.',50),
  ('marcom-command-center','Reporting','Summaries for management.',60),
  ('edu-admin','Learning tools (perangkat ajar)','Prepare teaching documents from templates.',10),
  ('edu-admin','Prota & Promes','Annual and semester programme planning.',20),
  ('edu-admin','Effective-week analysis','Calculate effective learning weeks.',30),
  ('edu-admin','Teaching schedule & journal','Organise schedules and teaching journals.',40),
  ('edu-admin','Administrative recap','Compile documents for supervision.',50),
  ('educlass','Learning materials','Share materials by class and subject.',10),
  ('educlass','Assignments & quizzes','Give tasks and quizzes, collect answers.',20),
  ('educlass','Schedules','Class and activity schedules.',30),
  ('educlass','Results & progress','Learning results and progress tracking.',40),
  ('educlass','Parent portal','Parents follow schedules and results.',50),
  ('ai-content-repurposing-studio','Content repurposing','Turn one source into several formats.',10),
  ('ai-content-repurposing-studio','AI copywriting drafts','Caption and copy drafts for review.',20),
  ('ai-content-repurposing-studio','Storyboard generator','Short-video storyboards from a brief.',30),
  ('ai-content-repurposing-studio','Social content planner','Plan posts across channels.',40),
  ('ai-content-repurposing-studio','Creative asset library','Keep approved assets in one place.',50)
) as f(slug, title, description, ord) on f.slug = p.slug
where not exists (select 1 from public.product_features x where x.product_id = p.id);

-- Package levels (price on request; no invented prices)
insert into public.pricing_packages(product_id, name, tier, description, billing_period, price_amount, currency, is_public, sort_order)
select p.id, t.name, t.tier, t.description, t.period, null, 'IDR', true, t.ord from public.products p
cross join (values
  ('Starter','starter','For a single team or outlet getting started.','custom',10),
  ('Professional','professional','More modules, users and support for growing organisations.','custom',20),
  ('Enterprise','enterprise','Multi-branch rollout, integrations and priority support.','custom',30),
  ('Custom','custom','Scope and features tailored to your requirements.','custom',40)
) as t(name, tier, description, period, ord)
where p.slug in ('waroeng-suramadu-erp','marcom-command-center','edu-admin','educlass','ai-content-repurposing-studio')
  and not exists (select 1 from public.pricing_packages x where x.product_id = p.id);

-- Owner-approved provisional verification, publication and sandbox demos
update public.products set
  verified_at = coalesce(verified_at, now()),
  verified_by = coalesce(verified_by, (select user_id from public.staff_members where role = 'super_admin' and is_active order by created_at limit 1))
where slug in ('waroeng-suramadu-erp','marcom-command-center','edu-admin','educlass','ai-content-repurposing-studio');
update public.products set publication_status = 'published', published_at = coalesce(published_at, now()),
  is_featured = slug in ('waroeng-suramadu-erp','marcom-command-center','educlass'), default_demo_minutes = 7
where slug in ('waroeng-suramadu-erp','marcom-command-center','edu-admin','educlass','ai-content-repurposing-studio');
update public.demo_policies d set enabled = true, mode = 'sandbox', duration_minutes = 7, idle_timeout_seconds = 90, max_active_sessions = 1,
  max_concurrent_sessions = 20, sessions_per_visitor_per_hour = 6, watermark_text = 'DEMO VERSION · NEXORA DIGITAL'
from public.products p where p.id = d.product_id and p.publication_status = 'published';
update public.products set demo_enabled = true where publication_status = 'published';

-- Launch article
insert into public.articles(title, slug, excerpt, body, status, published_at, seo_title, seo_description)
values ('Introducing NEXORA DIGITAL', 'introducing-nexora-digital',
 'A technology & product studio from Makassar building practical digital products and tailored software.',
 E'## Why NEXORA\n\nNEXORA DIGITAL is a technology & product studio based in Makassar, Indonesia. We build digital products for real operations — restaurants, marketing teams, schools and content creators — and tailored software when no product fits.\n\n## How we work\n\n- **Honest product status.** Every product shows its real stage: prototype, in development, beta or available.\n- **Try before you talk.** Products with a sandbox demo can be explored on synthetic data in a timed session.\n- **Clear commercial terms.** SaaS subscription, lifetime licence, custom development, maintenance or white-label — always written down before work starts.\n\n## What''s next\n\nWe are refining our first five products together with early users. Interested in a pilot or a custom project? [Talk to us](/contact).',
 'published', now(), 'Introducing NEXORA DIGITAL — Technology & Product Studio', 'NEXORA DIGITAL is a technology & product studio in Makassar building practical digital products and tailored software.')
on conflict (slug) do nothing;

commit;
