-- recovered verbatim from supabase_migrations.schema_migrations.statements (md5 2c206cd8d3ea249c704d03d582ac8ed4)
-- Company and Founder are effectively singleton tables (one row each) that
-- back the homepage About/Vision/Mission copy and the /founder page.

create table public.company (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Xeltrio Technologies Private Limited',
  tagline text,
  mission_statement text,
  vision_statement text,
  founded_year int,
  logo_url text,
  icon_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.founder (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null default 'Founder & CEO',
  company_name text,
  photo_url text,
  story jsonb not null default '[]'::jsonb,          -- array of paragraph strings
  quote_lines jsonb not null default '[]'::jsonb,     -- array of quote line strings
  quote_attribution text,
  mission_statement text,
  vision_statement text,
  company_vision_statement text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.company enable row level security;
alter table public.founder enable row level security;

create trigger set_company_updated_at before update on public.company
  for each row execute function public.set_updated_at();
create trigger set_founder_updated_at before update on public.founder
  for each row execute function public.set_updated_at();

-- Public can read (this is public marketing content); only staff can write.
create policy "company_public_read" on public.company for select using (true);
create policy "company_staff_write" on public.company for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

create policy "founder_public_read" on public.founder for select using (true);
create policy "founder_staff_write" on public.founder for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

-- Seed the current, real site content (from lib/constants.ts) so the
-- schema is immediately usable, not just an empty shell.
insert into public.company (name, tagline, mission_statement, vision_statement, founded_year)
values (
  'Xeltrio Technologies Private Limited',
  'The intelligence layer behind the enterprise.',
  'Build world-class AI software that transforms businesses.',
  'Become one of the world''s leading AI software companies.',
  2026
);

insert into public.founder (name, title, company_name, photo_url, story, quote_lines, quote_attribution, mission_statement, vision_statement, company_vision_statement)
values (
  'Muhammad Hamdan',
  'Founder & CEO',
  'Xeltrio Technologies Private Limited',
  '/founder-muhammad-hamdan.jpg',
  '["Xeltrio Technologies started from a simple observation: most enterprise software still asks people to operate it, when it should be operating itself. I founded Xeltrio to build the alternative — AI-native operating systems that run the operational core of a business, not just record it.", "That began with HamiaWorks AI, delivering hands-on automation to real businesses that needed results immediately. Every workflow automated, every AI agent shipped, became part of the same thesis: intelligence belongs underneath every system a business runs on, not bolted on as a feature.", "BusinessOS is where that thesis becomes a platform — one architecture, built to serve education, healthcare, retail, and every other vertical a business runs in. The long-term goal hasn''t changed since day one: transform how businesses operate, industry by industry, through AI that actually does the work."]'::jsonb,
  '["We are not building another software company.", "We are building the operating system for the future of business."]'::jsonb,
  'Muhammad Hamdan',
  'Build world-class AI software that transforms how businesses actually operate — not incrementally, but at the level of the operating system underneath them.',
  'A world where every business, regardless of size, runs on an intelligence layer instead of a collection of disconnected tools — where software decides what should happen next, not just records what did.',
  'Everything I believe about how software should work is now Xeltrio''s company vision, not just mine. BusinessOS, HamiaWorks AI, and every product after them are built to the same standard — because a company vision that only lives in one person''s head doesn''t scale past that person.'
);
