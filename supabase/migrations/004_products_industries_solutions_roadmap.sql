-- recovered verbatim from supabase_migrations.schema_migrations.statements (md5 2c206cd8d3ea249c704d03d582ac8ed4)
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.product_categories (id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  badge text,
  icon_name text,
  href text,
  status public.content_status not null default 'published',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.industries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  challenge text,
  ai_solution text,
  future_product text,
  icon_name text,
  sort_order int not null default 0,
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.solutions (
  id uuid primary key default gen_random_uuid(),
  industry_id uuid references public.industries (id) on delete set null,
  industry_name text not null,
  product_name text,
  problem text,
  solution text,
  sort_order int not null default 0,
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roadmap_steps (
  id uuid primary key default gen_random_uuid(),
  roadmap_key text not null default 'global',  -- 'global' | 'businessos' | 'company'
  label text not null,
  detail text,
  status text not null default 'future',        -- 'current' | 'next' | 'future'
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index roadmap_steps_key_idx on public.roadmap_steps (roadmap_key, sort_order);

alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.industries enable row level security;
alter table public.solutions enable row level security;
alter table public.roadmap_steps enable row level security;

create trigger set_product_categories_updated_at before update on public.product_categories
  for each row execute function public.set_updated_at();
create trigger set_products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger set_industries_updated_at before update on public.industries
  for each row execute function public.set_updated_at();
create trigger set_solutions_updated_at before update on public.solutions
  for each row execute function public.set_updated_at();
create trigger set_roadmap_steps_updated_at before update on public.roadmap_steps
  for each row execute function public.set_updated_at();

create policy "product_categories_public_read" on public.product_categories for select using (true);
create policy "product_categories_staff_write" on public.product_categories for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

create policy "products_public_read" on public.products for select using (status = 'published');
create policy "products_staff_read_all" on public.products for select using (public.is_staff_editor());
create policy "products_staff_write" on public.products for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

create policy "industries_public_read" on public.industries for select using (status = 'published');
create policy "industries_staff_read_all" on public.industries for select using (public.is_staff_editor());
create policy "industries_staff_write" on public.industries for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

create policy "solutions_public_read" on public.solutions for select using (status = 'published');
create policy "solutions_staff_read_all" on public.solutions for select using (public.is_staff_editor());
create policy "solutions_staff_write" on public.solutions for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

create policy "roadmap_steps_public_read" on public.roadmap_steps for select using (true);
create policy "roadmap_steps_staff_write" on public.roadmap_steps for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

-- Seed: ecosystem product categories + products (from lib/constants.ts ECOSYSTEM_PRODUCTS)
insert into public.product_categories (name, slug, sort_order) values
  ('Vertical', 'vertical', 1),
  ('Core', 'core', 2),
  ('Platform', 'platform', 3);

insert into public.products (name, slug, description, badge, status, sort_order) values
  ('BusinessOS', 'businessos', 'The core AI-native operating system for enterprise operations — the foundation every vertical is built on.', 'In Development', 'published', 1),
  ('EducationOS', 'educationos', 'An intelligent campus operating system for Pakistani private schools and the broader South Asia market.', 'First Vertical', 'published', 2),
  ('HospitalOS', 'hospitalos', 'AI-driven operations for patient flow, records, and hospital administration.', 'Coming Soon', 'published', 3),
  ('RetailOS', 'retailos', 'Intelligent inventory, storefront, and customer operations for modern retail businesses.', 'Coming Soon', 'published', 4),
  ('RestaurantOS', 'restaurantos', 'Order flow, kitchen operations, and customer experience, unified under one intelligence layer.', 'Coming Soon', 'published', 5),
  ('ManufacturingOS', 'manufacturingos', 'Production planning, floor operations, and supply visibility powered by autonomous AI agents.', 'Coming Soon', 'published', 6),
  ('LogisticsOS', 'logisticsos', 'Fleet, route, and delivery intelligence built for scale across distributed operations.', 'Coming Soon', 'published', 7),
  ('CRM', 'crm', 'Relationship intelligence that qualifies, follows up, and closes — with AI in the loop at every stage.', 'Coming Soon', 'published', 8),
  ('HRMS', 'hrms', 'Workforce operations — hiring, attendance, payroll, and performance — orchestrated by AI.', 'Coming Soon', 'published', 9),
  ('Inventory', 'inventory', 'Real-time stock intelligence with predictive replenishment across every connected vertical.', 'Coming Soon', 'published', 10),
  ('Finance', 'finance', 'Automated ledgers, reconciliation, and financial reporting built for institutional accuracy.', 'Coming Soon', 'published', 11),
  ('Future AI Products', 'future-ai-products', 'The Xeltrio ecosystem is designed to keep expanding — new verticals ship as the platform matures.', 'Roadmap', 'published', 12);

-- Seed: industries (from lib/constants.ts INDUSTRIES)
insert into public.industries (slug, name, description, challenge, ai_solution, future_product, sort_order) values
  ('education', 'Education', 'Campus operations for private schools and educational institutions across South Asia.', 'Admissions, attendance, fees, and parent communication run across disconnected registers, spreadsheets, and phone calls.', 'EducationOS unifies every one of those workflows under a single AI-orchestrated campus operating system, with agents handling routine follow-ups.', 'EducationOS', 1),
  ('healthcare', 'Healthcare', 'Patient flow, records, and administration for hospitals and clinics.', 'Patient records, scheduling, and inter-department coordination are fragmented across paper trails and disconnected systems.', 'HospitalOS gives every department a shared, AI-assisted view of patient flow, records, and operations in real time.', 'HospitalOS', 2),
  ('retail', 'Retail', 'Storefront, inventory, and customer operations for modern retail businesses.', 'Inventory, storefront, and customer data live in separate tools that never reconcile automatically, so stock counts are always a guess.', 'RetailOS connects inventory, sales, and customer operations into one intelligence layer that reconciles itself continuously.', 'RetailOS', 3),
  ('manufacturing', 'Manufacturing', 'Production planning and floor operations for manufacturing businesses.', 'Production planning and floor visibility depend on manual reporting that''s always a step behind what''s actually happening.', 'ManufacturingOS gives production, supply, and floor operations a live, AI-monitored operational picture instead of yesterday''s report.', 'ManufacturingOS', 4),
  ('restaurant', 'Restaurant', 'Order flow, kitchen operations, and guest experience for food service businesses.', 'Ordering, kitchen timing, and inventory are managed in separate systems that don''t talk to each other, so waste and delays go unnoticed.', 'RestaurantOS connects ordering, kitchen operations, and inventory into one system, with AI smoothing the handoffs between them.', 'RestaurantOS', 5),
  ('real-estate', 'Real Estate', 'Listings, leads, and transaction pipelines for real estate operations.', 'Listings, leads, and transactions are tracked across disconnected CRMs and spreadsheets, so nothing stays in sync.', 'BusinessOS''s CRM and automation modules bring listings, leads, and deal flow into one coordinated pipeline today, ahead of a dedicated vertical.', 'Planned ecosystem vertical', 6),
  ('logistics', 'Logistics', 'Fleet, route, and delivery intelligence for distributed operations.', 'Fleet, route, and delivery data is siloed, making real-time visibility and planning genuinely difficult.', 'LogisticsOS unifies fleet, route, and delivery intelligence into one AI-coordinated operations layer.', 'LogisticsOS', 7),
  ('smes', 'SMEs', 'Enterprise-grade operations for growing small and mid-sized businesses.', 'Small and mid-sized businesses can''t justify a full enterprise software stack, so they run critical operations on spreadsheets instead.', 'BusinessOS''s core — CRM, HRMS, Finance, Inventory — gives growing businesses enterprise-grade operations without enterprise-grade overhead.', 'BusinessOS Core', 8),
  ('enterprise', 'Enterprise', 'A single intelligence layer for large, multi-department organizations.', 'Large organizations run dozens of disconnected systems that don''t share data, let alone intelligence, across departments.', 'BusinessOS becomes the single intelligence layer underneath every department, replacing fragmented point solutions one at a time.', 'BusinessOS Enterprise', 9);

-- Seed: global roadmap (from lib/constants.ts ROADMAP_STEPS)
insert into public.roadmap_steps (roadmap_key, label, detail, status, sort_order) values
  ('global', 'Corporate Website', 'Xeltrio Technologies goes public — the ecosystem, the vision, and HamiaWorks AI, introduced.', 'current', 1),
  ('global', 'BusinessOS', 'The core AI operating system enters active development — the foundation every vertical builds on.', 'next', 2),
  ('global', 'EducationOS', 'First vertical ships — built for Pakistani private schools and the broader South Asia market.', 'next', 3),
  ('global', 'HospitalOS', 'AI-native operations for patient flow, records, and hospital administration.', 'future', 4),
  ('global', 'RetailOS', 'Intelligent inventory, storefront, and customer operations for modern retail.', 'future', 5),
  ('global', 'RestaurantOS', 'Order flow, kitchen operations, and guest experience for food service businesses.', 'future', 6),
  ('global', 'ManufacturingOS', 'Production planning, floor operations, and supply visibility for manufacturers.', 'future', 7),
  ('global', 'LogisticsOS', 'Fleet, route, and delivery intelligence across distributed operations.', 'future', 8),
  ('global', 'Enterprise Marketplace', 'A marketplace of modules and integrations, letting enterprise customers assemble the platform their operations need.', 'future', 9),
  ('global', 'Global Expansion', 'The Xeltrio ecosystem scales beyond South Asia into new markets and regions.', 'future', 10);
