-- recovered verbatim from supabase_migrations.schema_migrations.statements (md5 2c206cd8d3ea249c704d03d582ac8ed4)
-- One row per named brand/product page (HM Signature, HamiaWorks AI,
-- BusinessOS, Future Ventures) holding its top-level hero/story content.
-- The many card-grid sections under each page live in content_items,
-- keyed by collection (e.g. 'hm_philosophy_pillars', 'businessos_features').
create table public.brand_pages (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,   -- 'hm_signature' | 'hamiaworks_ai' | 'businessos' | 'future_ventures'
  hero_title text,
  hero_subtitle text,
  hero_description text,
  story jsonb not null default '[]'::jsonb,
  logo_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The Perfume Collection grid specifically — a real list of product-like
-- entities (distinct from the generic content_items), since fragrances
-- will eventually carry their own price/SKU/inventory-style fields.
create table public.hm_signature_fragrances (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  note text,
  image_url text,
  status public.content_status not null default 'published',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.navigation_items (id) on delete cascade,
  label text not null,
  href text not null,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.footer_links (
  id uuid primary key default gen_random_uuid(),
  column_key text not null,  -- 'company' | 'products' | 'solutions' | 'industries' | 'resources' | 'legal'
  label text not null,
  href text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.legal_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  topics jsonb not null default '[]'::jsonb,
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status public.content_status not null default 'published',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index navigation_items_parent_idx on public.navigation_items (parent_id, sort_order);
create index footer_links_column_idx on public.footer_links (column_key, sort_order);

alter table public.brand_pages enable row level security;
alter table public.hm_signature_fragrances enable row level security;
alter table public.navigation_items enable row level security;
alter table public.footer_links enable row level security;
alter table public.legal_pages enable row level security;
alter table public.resources enable row level security;

create trigger set_brand_pages_updated_at before update on public.brand_pages
  for each row execute function public.set_updated_at();
create trigger set_hm_fragrances_updated_at before update on public.hm_signature_fragrances
  for each row execute function public.set_updated_at();
create trigger set_navigation_items_updated_at before update on public.navigation_items
  for each row execute function public.set_updated_at();
create trigger set_footer_links_updated_at before update on public.footer_links
  for each row execute function public.set_updated_at();
create trigger set_legal_pages_updated_at before update on public.legal_pages
  for each row execute function public.set_updated_at();
create trigger set_resources_updated_at before update on public.resources
  for each row execute function public.set_updated_at();

create policy "brand_pages_public_read" on public.brand_pages for select using (true);
create policy "brand_pages_staff_write" on public.brand_pages for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

create policy "hm_fragrances_public_read" on public.hm_signature_fragrances for select using (status = 'published');
create policy "hm_fragrances_staff_read_all" on public.hm_signature_fragrances for select using (public.is_staff_editor());
create policy "hm_fragrances_staff_write" on public.hm_signature_fragrances for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

create policy "navigation_public_read" on public.navigation_items for select using (is_active = true);
create policy "navigation_staff_write" on public.navigation_items for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

create policy "footer_links_public_read" on public.footer_links for select using (is_active = true);
create policy "footer_links_staff_write" on public.footer_links for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

create policy "legal_pages_public_read" on public.legal_pages for select using (status = 'published');
create policy "legal_pages_staff_write" on public.legal_pages for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

create policy "resources_public_read" on public.resources for select using (status = 'published');
create policy "resources_staff_write" on public.resources for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

-- Seed: HM Signature fragrance collection (from lib/constants.ts HM_COLLECTION_PREVIEW)
insert into public.hm_signature_fragrances (name, note, sort_order) values
  ('Mystic Oud', 'The house''s founding signature.', 1),
  ('Noir', 'Deeper, warmer, evening-facing.', 2),
  ('Aurum', 'Gold-toned, amber and oud led.', 3),
  ('Velvet Musk', 'Soft, close-wearing, quietly confident.', 4);

-- Seed: legal pages (from lib/constants.ts LEGAL_PAGES)
insert into public.legal_pages (slug, title, summary, topics) values
  ('privacy-policy', 'Privacy Policy', 'How Xeltrio Technologies will handle personal data once BusinessOS and its ecosystem are live.',
   '["What information is collected when visiting this website or, later, using BusinessOS", "How that information is used and who it''s shared with, if anyone", "How long data is retained and how it can be deleted on request", "The rights visitors and future customers have over their own data"]'::jsonb),
  ('terms-of-service', 'Terms of Service', 'The terms that will govern use of the Xeltrio Technologies website and, later, the BusinessOS platform.',
   '["Acceptable use of this website and the BusinessOS ecosystem once available", "Ownership of content, trademarks, and the Xeltrio brand", "Limitations of liability and disclaimers of warranty", "How these terms can change, and how customers will be notified"]'::jsonb),
  ('cookie-policy', 'Cookie Policy', 'How cookies and similar technologies will be used across Xeltrio Technologies'' digital properties.',
   '["Which categories of cookies this site and future products use", "The difference between essential and optional cookies", "How to control or opt out of non-essential cookies", "How this policy will be kept current as tooling changes"]'::jsonb),
  ('disclaimer', 'Disclaimer', 'General disclaimers covering the information published on this website.',
   '["That roadmap, timeline, and future-product information reflects current intent, not a guarantee", "That product names and modules described here are in active development unless stated otherwise", "Limitations on the accuracy of forward-looking statements made across the site", "How to report an inaccuracy or request a correction"]'::jsonb);
