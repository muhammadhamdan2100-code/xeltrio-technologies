-- recovered verbatim from supabase_migrations.schema_migrations.statements (md5 2c206cd8d3ea249c704d03d582ac8ed4)
-- Contact form submissions: anyone (including anonymous site visitors) can
-- INSERT, but only staff can ever read, update, or delete. This is the
-- opposite RLS shape from the content tables above — public write, private read.

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  company_name text,
  email text not null,
  phone text,
  country text,
  service text,
  budget text,
  timeline text,
  message text not null,
  status public.message_status not null default 'new',
  created_at timestamptz not null default now()
);

create index contact_messages_status_idx on public.contact_messages (status, created_at desc);

alter table public.contact_messages enable row level security;

create policy "contact_messages_public_insert" on public.contact_messages
  for insert to anon, authenticated with check (true);
create policy "contact_messages_staff_read" on public.contact_messages
  for select using (public.is_staff_editor());
create policy "contact_messages_staff_manage" on public.contact_messages
  for update using (public.is_staff_editor()) with check (public.is_staff_editor());
create policy "contact_messages_staff_delete" on public.contact_messages
  for delete using (public.is_staff_editor());

-- Newsletter subscribers: public insert; a unique index on lower(email)
-- prevents duplicates (case-insensitively) at the database level, not
-- just in application code.
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'subscribed',  -- 'subscribed' | 'unsubscribed'
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create unique index newsletter_subscribers_email_lower_idx on public.newsletter_subscribers (lower(email));

alter table public.newsletter_subscribers enable row level security;

create policy "newsletter_public_insert" on public.newsletter_subscribers
  for insert to anon, authenticated with check (true);
create policy "newsletter_staff_read" on public.newsletter_subscribers
  for select using (public.is_staff_editor());
create policy "newsletter_staff_manage" on public.newsletter_subscribers
  for update using (public.is_staff_editor()) with check (public.is_staff_editor());
create policy "newsletter_staff_delete" on public.newsletter_subscribers
  for delete using (public.is_staff_editor());
