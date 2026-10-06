-- recovered verbatim from supabase_migrations.schema_migrations.statements (md5 2c206cd8d3ea249c704d03d582ac8ed4)
-- content_items: a single, generic, polymorphic table for the dozens of
-- structurally-identical "card grid" collections across the site (core
-- values, why-xeltrio, technology pillars, HamiaWorks services, BusinessOS
-- features/pillars, security pillars, HM Signature philosophy/ingredients,
-- future ventures, etc). Rather than creating ~20 near-duplicate tables
-- (title/description/icon/sort_order, over and over), every one of those
-- collections lives here, distinguished by `collection`. This is the
-- reusable pattern the brief's "no duplicated code / reusable services"
-- goal actually points to at the schema level.
--
-- `collection` values in use (add new ones freely, no migration required):
--   core_values, why_xeltrio, technology_pillars, hamiaworks_services,
--   businessos_pillars, businessos_features, ai_platform_capabilities,
--   security_pillars, enterprise_features, company_trust,
--   founder_vision_cards, founder_highlights, hm_philosophy_pillars,
--   hm_why_reasons, hm_ingredients, hm_craftsmanship_steps,
--   hm_future_vision, future_ventures, resources_sections,
--   careers_pillars, press_sections, media_center_sections,
--   research_areas, contact_why_reasons, contact_info_cards

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  collection text not null,
  title text not null,
  subtitle text,
  description text,
  icon_name text,
  badge text,
  image_url text,
  href text,
  sort_order int not null default 0,
  status public.content_status not null default 'published',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_items_collection_idx on public.content_items (collection, sort_order);
create index content_items_metadata_idx on public.content_items using gin (metadata);

alter table public.content_items enable row level security;

create trigger set_content_items_updated_at before update on public.content_items
  for each row execute function public.set_updated_at();

create policy "content_items_public_read" on public.content_items
  for select using (status = 'published');
create policy "content_items_staff_read_all" on public.content_items
  for select using (public.is_staff_editor());
create policy "content_items_staff_write" on public.content_items
  for all using (public.is_staff_editor()) with check (public.is_staff_editor());

-- Seed a representative set of real collections (proof the schema works
-- end to end) — the remaining ~15 collections follow this exact pattern
-- and are a straightforward follow-up seeding pass, not a schema change.

insert into public.content_items (collection, title, description, sort_order) values
  ('core_values', 'Innovation', 'We build what enterprise software should have been from the start — intelligent by default, not bolted on.', 1),
  ('core_values', 'Trust', 'Every system we ship is engineered to be understood, audited, and relied upon by the organizations that run on it.', 2),
  ('core_values', 'Quality', 'We hold every release to a single bar: production-grade, enterprise-ready, and built to last a decade, not a demo.', 3),
  ('core_values', 'Scalability', 'Our architecture is designed for one school today and thousands of institutions tomorrow, without a rewrite.', 4),
  ('core_values', 'Security', 'Data protection and access control are architectural decisions, made on day one, not compliance patches.', 5),
  ('core_values', 'Long-Term Thinking', 'We design operating systems, not features — foundations that our customers can build on for years.', 6),
  ('core_values', 'Customer Success', 'Our product succeeds when the institutions running it do. We measure ourselves against their outcomes.', 7);

insert into public.content_items (collection, title, description, sort_order) values
  ('why_xeltrio', 'AI First', 'Intelligence isn''t a feature we add later — every workflow is designed around an autonomous AI layer from the ground up.', 1),
  ('why_xeltrio', 'Enterprise Ready', 'Built for the complexity of real institutions — multi-department, multi-role, multi-branch — not a single-user toy.', 2),
  ('why_xeltrio', 'Secure', 'Role-based access, encrypted data pathways, and audit-ready infrastructure engineered in from the first line of code.', 3),
  ('why_xeltrio', 'Scalable', 'One core architecture powers every vertical in the Xeltrio ecosystem, so growth never means starting over.', 4),
  ('why_xeltrio', 'Future Focused', 'We design for where enterprise software is going — autonomous, conversational, and self-optimizing.', 5),
  ('why_xeltrio', 'Cloud Native', 'Distributed, resilient, and built for continuous delivery — no legacy servers, no maintenance windows.', 6);

insert into public.content_items (collection, title, description, sort_order) values
  ('company_trust', 'Mission', 'Build world-class AI software that transforms businesses.', 1),
  ('company_trust', 'Vision', 'Become one of the world''s leading AI software companies.', 2),
  ('company_trust', 'Core Values', 'Innovation, trust, quality, and long-term thinking, held to the same standard on every product.', 3),
  ('company_trust', 'Security', 'Role-based access, encryption, and audit-ready infrastructure engineered in from day one.', 4),
  ('company_trust', 'Innovation', 'Every product starts from first principles, not from copying the category leader.', 5),
  ('company_trust', 'Enterprise Quality', 'Held to a single bar — production-grade and built to last a decade, not a demo.', 6),
  ('company_trust', 'Compliance', 'Built with an eye toward the regional and industry standards BusinessOS will need to meet as it scales.', 7),
  ('company_trust', 'Global Standards', 'Architected to the same bar whether it''s serving one branch or an international enterprise.', 8);

insert into public.content_items (collection, title, description, metadata, sort_order) values
  ('hamiaworks_services', 'AI Automation', 'End-to-end automation of operational workflows across every business function.', '{}', 1),
  ('hamiaworks_services', 'AI Employees', 'Persistent AI agents that own a role — handling tickets, follow-ups, and routine decisions.', '{}', 2),
  ('hamiaworks_services', 'AI Agents', 'Task-specific autonomous agents that plan, execute, and report without manual oversight.', '{}', 3),
  ('hamiaworks_services', 'WhatsApp AI', 'Conversational AI operations delivered natively inside WhatsApp — the channel South Asia already runs on.', '{}', 4),
  ('hamiaworks_services', 'Voice AI', 'Natural, real-time voice interfaces for support, scheduling, and enterprise communication.', '{}', 5),
  ('hamiaworks_services', 'Workflow Automation', 'Custom-built automation pipelines that connect every tool a business already uses.', '{}', 6),
  ('hamiaworks_services', 'Enterprise AI', 'AI systems engineered for institutional scale, governance, and reliability.', '{}', 7),
  ('hamiaworks_services', 'Custom AI Development', 'Bespoke AI systems built around a specific operational problem, not a generic template.', '{}', 8),
  ('hamiaworks_services', 'Business Automation', 'Automating the operational core of a business, from onboarding to reporting.', '{}', 9),
  ('hamiaworks_services', 'AI Consulting', 'Strategic guidance on where AI actually creates leverage in your operations — and where it doesn''t.', '{}', 10),
  ('hamiaworks_services', 'AI Integration', 'Connecting AI systems into the tools a business already runs on, without disrupting daily operations.', '{}', 11);
