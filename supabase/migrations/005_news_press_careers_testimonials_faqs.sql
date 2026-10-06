-- recovered verbatim from supabase_migrations.schema_migrations.statements (md5 2c206cd8d3ea249c704d03d582ac8ed4)
create table public.news_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  image_url text,
  category text,
  featured boolean not null default false,
  published_at timestamptz,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.press_releases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  published_at timestamptz,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  published_at timestamptz,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.careers_jobs (
  id uuid primary key default gen_random_uuid(),
  department text not null,
  title text not null,
  location text,
  employment_type public.employment_type not null default 'full_time',
  salary_range text,
  status public.job_status not null default 'draft',
  description text,
  requirements jsonb not null default '[]'::jsonb,
  benefits jsonb not null default '[]'::jsonb,
  application_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_title text,
  company_name text,
  quote text not null,
  avatar_url text,
  status public.content_status not null default 'published',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  page_key text not null default 'general',   -- 'contact' | 'general' | etc.
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index news_articles_status_idx on public.news_articles (status, published_at desc);
create index press_releases_status_idx on public.press_releases (status, published_at desc);
create index announcements_status_idx on public.announcements (status, published_at desc);
create index careers_jobs_status_idx on public.careers_jobs (status);
create index faqs_page_key_idx on public.faqs (page_key, sort_order);

alter table public.news_articles enable row level security;
alter table public.press_releases enable row level security;
alter table public.announcements enable row level security;
alter table public.careers_jobs enable row level security;
alter table public.testimonials enable row level security;
alter table public.faqs enable row level security;

create trigger set_news_articles_updated_at before update on public.news_articles
  for each row execute function public.set_updated_at();
create trigger set_press_releases_updated_at before update on public.press_releases
  for each row execute function public.set_updated_at();
create trigger set_announcements_updated_at before update on public.announcements
  for each row execute function public.set_updated_at();
create trigger set_careers_jobs_updated_at before update on public.careers_jobs
  for each row execute function public.set_updated_at();
create trigger set_testimonials_updated_at before update on public.testimonials
  for each row execute function public.set_updated_at();
create trigger set_faqs_updated_at before update on public.faqs
  for each row execute function public.set_updated_at();

create policy "news_public_read" on public.news_articles for select using (status = 'published');
create policy "news_staff_read_all" on public.news_articles for select using (public.is_staff_editor());
create policy "news_staff_write" on public.news_articles for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

create policy "press_public_read" on public.press_releases for select using (status = 'published');
create policy "press_staff_read_all" on public.press_releases for select using (public.is_staff_editor());
create policy "press_staff_write" on public.press_releases for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

create policy "announcements_public_read" on public.announcements for select using (status = 'published');
create policy "announcements_staff_read_all" on public.announcements for select using (public.is_staff_editor());
create policy "announcements_staff_write" on public.announcements for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

create policy "careers_public_read" on public.careers_jobs for select using (status = 'open');
create policy "careers_staff_read_all" on public.careers_jobs for select using (public.is_staff_editor());
create policy "careers_staff_write" on public.careers_jobs for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

create policy "testimonials_public_read" on public.testimonials for select using (status = 'published');
create policy "testimonials_staff_read_all" on public.testimonials for select using (public.is_staff_editor());
create policy "testimonials_staff_write" on public.testimonials for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

create policy "faqs_public_read" on public.faqs for select using (status = 'published');
create policy "faqs_staff_read_all" on public.faqs for select using (public.is_staff_editor());
create policy "faqs_staff_write" on public.faqs for all
  using (public.is_staff_editor()) with check (public.is_staff_editor());

-- Seed the Contact page's existing FAQ content (from lib/constants.ts CONTACT_FAQ)
insert into public.faqs (page_key, question, answer, sort_order) values
  ('contact', 'How quickly do you respond?', 'The team is small today, so responses are handled personally rather than by a queue — expect a reply within a few business days while Xeltrio is at this stage.', 1),
  ('contact', 'What industries do you serve?', 'Education and general enterprise operations first, with healthcare, retail, manufacturing, logistics, and restaurants planned as BusinessOS''s ecosystem expands — see the Industries page for the full picture.', 2),
  ('contact', 'Can you build custom AI systems?', 'Yes — that''s what HamiaWorks AI, Xeltrio''s AI services division, does directly: custom automation, AI agents, and workflow systems built around a specific operational problem.', 3),
  ('contact', 'Do you work internationally?', 'Xeltrio is based in Pakistan today and is expanding deliberately — South Asia, then the Middle East, then further. International inquiries are welcome even ahead of a local office.', 4),
  ('contact', 'Can I request a consultation?', 'Yes — select the service you''re interested in in the form below and mention it''s for a consultation in your message.', 5);
