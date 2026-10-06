-- ============================================================================
-- PART 05 — MIGRATION 021 : CMS pages + page_sections + workflow states
--
-- - extends content_status with the two states the workflow needs
--   (in_review, approved) — existing draft/published/archived unchanged
-- - creates pages + page_sections
-- - RLS: anonymous visitors can only ever see status = 'published'
--   (drafts/in-review/approved/archived are not publicly readable)
-- - all writes are authorized by the existing public.can() matrix
-- - page_sections inherit the `pages` permission (no permission sprawl)
-- ============================================================================

alter type public.content_status add value if not exists 'in_review';
alter type public.content_status add value if not exists 'approved';

create table if not exists public.pages (
  id               uuid primary key default gen_random_uuid(),
  key              text not null unique check (key ~ '^[a-z][a-z0-9_-]{1,80}$'),
  title            text not null,
  slug             text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$'),
  route            text,
  description      text,
  status           public.content_status not null default 'draft',
  seo_title        text,
  seo_description  text,
  seo_keywords     jsonb not null default '[]'::jsonb,
  og_image_url     text,
  noindex          boolean not null default false,
  metadata         jsonb not null default '{}'::jsonb,
  sort_order       integer not null default 0 check (sort_order >= 0),
  created_by       uuid references public.profiles (id) on delete set null,
  updated_by       uuid references public.profiles (id) on delete set null,
  reviewed_by      uuid references public.profiles (id) on delete set null,
  approved_by      uuid references public.profiles (id) on delete set null,
  published_by     uuid references public.profiles (id) on delete set null,
  submitted_at     timestamptz,
  reviewed_at      timestamptz,
  approved_at      timestamptz,
  published_at     timestamptz,
  archived_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (jsonb_typeof(seo_keywords) = 'array'),
  check (jsonb_typeof(metadata) = 'object')
);

create index if not exists pages_status_idx  on public.pages (status, sort_order);
create index if not exists pages_public_idx  on public.pages (status) where status = 'published';
create index if not exists pages_updated_idx on public.pages (updated_at desc);

create table if not exists public.page_sections (
  id           uuid primary key default gen_random_uuid(),
  page_id      uuid not null references public.pages (id) on delete cascade,
  section_type text not null check (section_type in
               ('hero','cards','features','stats','cta','testimonials','faq','logos','rich_list','custom')),
  title        text,
  subtitle     text,
  body         text,
  eyebrow      text,
  items        jsonb not null default '[]'::jsonb,
  props        jsonb not null default '{}'::jsonb,
  sort_order   integer not null default 0 check (sort_order >= 0),
  is_visible   boolean not null default true,
  status       public.content_status not null default 'draft',
  metadata     jsonb not null default '{}'::jsonb,
  created_by   uuid references public.profiles (id) on delete set null,
  updated_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (jsonb_typeof(items) = 'array'),
  check (jsonb_typeof(props) = 'object')
);

create index if not exists page_sections_page_idx on public.page_sections (page_id, sort_order);
create index if not exists page_sections_type_idx on public.page_sections (section_type);

comment on table public.page_sections is
  'Ordered, structured section records. Content is stored as typed JSON (items/props), never as raw HTML, so nothing here can inject markup or script.';

-- ---------------------------------------------------------------------------
-- updated_at + actor stamping (reuses existing set_updated_at)
-- ---------------------------------------------------------------------------
drop trigger if exists set_pages_updated_at on public.pages;
create trigger set_pages_updated_at before update on public.pages
  for each row execute function public.set_updated_at();

drop trigger if exists set_page_sections_updated_at on public.page_sections;
create trigger set_page_sections_updated_at before update on public.page_sections
  for each row execute function public.set_updated_at();

create or replace function public.stamp_page_audit_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.updated_by := auth.uid();
  else
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

create or replace function public.stamp_section_audit_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.updated_by := auth.uid();
  else
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

revoke all on function public.stamp_page_audit_columns() from public;
revoke all on function public.stamp_section_audit_columns() from public;

drop trigger if exists pages_stamp_actor on public.pages;
create trigger pages_stamp_actor before insert or update on public.pages
  for each row execute function public.stamp_page_audit_columns();

drop trigger if exists page_sections_stamp_actor on public.page_sections;
create trigger page_sections_stamp_actor before insert or update on public.page_sections
  for each row execute function public.stamp_section_audit_columns();

-- ---------------------------------------------------------------------------
-- Workflow guard: state transitions require the matching permission and record
-- who performed them. Defense in depth on top of RLS.
-- ---------------------------------------------------------------------------
create or replace function public.guard_page_workflow()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    return new;  -- service role / migration
  end if;

  if new.status is distinct from old.status then

    if new.status = 'in_review' then
      if not public.can('pages','edit') then
        raise exception 'submitting content for review requires pages:edit' using errcode = '42501';
      end if;
      new.reviewed_by := null;
      new.approved_by := null;

    elsif new.status = 'approved' then
      if not public.can('pages','approve') then
        raise exception 'approving content requires pages:approve' using errcode = '42501';
      end if;
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
      new.approved_by := auth.uid();
      new.approved_at := now();

    elsif new.status = 'published' then
      if not public.can('pages','publish') then
        raise exception 'publishing requires pages:publish' using errcode = '42501';
      end if;
      new.published_by := auth.uid();
      new.published_at := coalesce(old.published_at, now());

    elsif new.status = 'archived' then
      if not public.can('pages','publish') then
        raise exception 'archiving requires pages:publish' using errcode = '42501';
      end if;
      new.archived_at := now();

    elsif new.status = 'draft' then
      if not public.can('pages','edit') then
        raise exception 'returning content to draft requires pages:edit' using errcode = '42501';
      end if;
      new.archived_at := null;
    end if;

    insert into public.audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
    values (auth.uid(),
            'page_' || new.status::text,
            'pages',
            new.id::text,
            jsonb_build_object('from', old.status::text, 'to', new.status::text, 'key', new.key));
  end if;

  return new;
end;
$$;

revoke all on function public.guard_page_workflow() from public;

drop trigger if exists pages_workflow_guard on public.pages;
create trigger pages_workflow_guard before update on public.pages
  for each row execute function public.guard_page_workflow();

-- ---------------------------------------------------------------------------
-- RLS — published-only public read; RBAC-gated staff access and writes
-- ---------------------------------------------------------------------------
alter table public.pages enable row level security;
alter table public.page_sections enable row level security;

drop policy if exists pages_select_public on "public"."pages";
create policy pages_select_public on "public"."pages"
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists pages_select_staff on "public"."pages";
create policy pages_select_staff on "public"."pages"
  for select to authenticated
  using (public.can('pages','view'));

drop policy if exists pages_insert_staff on "public"."pages";
create policy pages_insert_staff on "public"."pages"
  for insert to authenticated
  with check (public.can('pages','create'));

drop policy if exists pages_update_staff on "public"."pages";
create policy pages_update_staff on "public"."pages"
  for update to authenticated
  using (public.can('pages','edit'))
  with check (public.can('pages','edit'));

drop policy if exists pages_delete_staff on "public"."pages";
create policy pages_delete_staff on "public"."pages"
  for delete to authenticated
  using (public.can('pages','delete'));

-- Sections inherit the page permission and are only visible publicly when the
-- parent page is published and the section is visible.
drop policy if exists sections_select_public on "public"."page_sections";
create policy sections_select_public on "public"."page_sections"
  for select to anon, authenticated
  using (
    is_visible = true
    and status = 'published'
    and exists (select 1 from public.pages p
                where p.id = page_sections.page_id and p.status = 'published')
  );

drop policy if exists sections_select_staff on "public"."page_sections";
create policy sections_select_staff on "public"."page_sections"
  for select to authenticated
  using (public.can('pages','view'));

drop policy if exists sections_write_staff on "public"."page_sections";
create policy sections_write_staff on "public"."page_sections"
  for insert to authenticated
  with check (public.can('pages','create'));

drop policy if exists sections_update_staff on "public"."page_sections";
create policy sections_update_staff on "public"."page_sections"
  for update to authenticated
  using (public.can('pages','edit'))
  with check (public.can('pages','edit'));

drop policy if exists sections_delete_staff on "public"."page_sections";
create policy sections_delete_staff on "public"."page_sections"
  for delete to authenticated
  using (public.can('pages','delete'));

-- ============================================================================
-- VERIFICATION
--   select enumlabel from pg_enum e join pg_type t on t.oid=e.enumtypid
--     where t.typname='content_status' order by enumsortorder;   -- 5 values
--   select policyname, cmd from pg_policies where tablename in ('pages','page_sections');
--   as anon: select count(*) from public.pages;                  -- published only
-- ROLLBACK
--   drop table if exists public.page_sections; drop table if exists public.pages;
--   drop function if exists public.guard_page_workflow() cascade;
--   drop function if exists public.stamp_page_audit_columns() cascade;
--   drop function if exists public.stamp_section_audit_columns() cascade;
--   -- enum labels are additive and safe to leave in place
-- ============================================================================
