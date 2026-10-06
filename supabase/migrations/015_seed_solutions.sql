-- recovered verbatim from supabase_migrations.schema_migrations.statements (md5 2c206cd8d3ea249c704d03d582ac8ed4)
insert into public.solutions (industry_name, product_name, problem, solution, sort_order) values
  ('Education', 'EducationOS', 'Admissions, attendance, fees, and communication run across disconnected registers and spreadsheets.', 'EducationOS unifies admissions, academics, finance, and parent communication under one AI-orchestrated campus operating system.', 1),
  ('Healthcare', 'HospitalOS', 'Patient records, scheduling, and administration are fragmented across departments and paper trails.', 'HospitalOS gives every department a shared, AI-assisted view of patient flow, records, and operations.', 2),
  ('Retail', 'RetailOS', 'Inventory, storefront, and customer data live in separate tools that never reconcile automatically.', 'RetailOS connects inventory, sales, and customer operations into one intelligence layer that reconciles itself.', 3),
  ('Manufacturing', 'ManufacturingOS', 'Production planning and floor visibility depend on manual reporting that''s always a step behind reality.', 'ManufacturingOS gives production, supply, and floor operations a live, AI-monitored operational picture.', 4),
  ('Real Estate', 'Coming in a future ecosystem release', 'Listings, leads, and transactions are tracked across disconnected CRMs and spreadsheets.', 'BusinessOS''s CRM and automation modules bring listings, leads, and deal flow into one coordinated pipeline today, ahead of a dedicated vertical.', 5),
  ('Logistics', 'LogisticsOS', 'Fleet, route, and delivery data is siloed, making real-time visibility and planning difficult.', 'LogisticsOS unifies fleet, route, and delivery intelligence into one AI-coordinated operations layer.', 6),
  ('Restaurant', 'RestaurantOS', 'Order flow, kitchen timing, and inventory are managed separately, with nothing talking to finance.', 'RestaurantOS connects ordering, kitchen operations, and inventory into one system, with AI smoothing the handoffs between them.', 7),
  ('SMEs', 'BusinessOS', 'Small and mid-sized businesses can''t justify a full enterprise software stack, so they run on spreadsheets instead.', 'BusinessOS''s core — CRM, HRMS, Finance, Inventory — gives growing businesses enterprise-grade operations without enterprise-grade overhead.', 8),
  ('Enterprise', 'BusinessOS', 'Large organizations run dozens of disconnected systems that don''t share data or intelligence.', 'BusinessOS becomes the single intelligence layer underneath every department, replacing fragmented point solutions.', 9);

-- Backfill industry_id now that both tables have matching rows
update public.solutions s
set industry_id = i.id
from public.industries i
where lower(s.industry_name) = i.slug or lower(s.industry_name) = lower(i.name);
